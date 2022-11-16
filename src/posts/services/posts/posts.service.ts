import { HttpException, Inject, Injectable, Scope } from "@nestjs/common";
import { PostCreationPayloadDto, VotePostPayloadDto, VoteType } from "../../dtos";
import { User } from "../../../users/models";
import { Post, PostTag } from "../../models";
import { IPostsService, postSortCallback } from "./posts.service.interface";
import { _$ } from "../../../_domain/injectableTokens";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { DeletedProps } from "../../models/toSelf";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { UserToPostRelTypes } from "../../../users/models/toPost";
import { IAutoModerationService } from "../../../moderation/services/autoModeration/autoModeration.service.interface";

@Injectable({ scope: Scope.REQUEST })
export class PostsService implements IPostsService {
    private readonly _request: Request;
    private readonly _dbContext: DatabaseContext;
    private readonly _autoModerationService: IAutoModerationService;

    constructor(
        @Inject(REQUEST) request: Request,
        @Inject(_$.IDatabaseContext) databaseContext: DatabaseContext,
        @Inject(_$.IAutoModerationService) autoModerationService: IAutoModerationService
    ) {
        this._request = request;
        this._dbContext = databaseContext;
        this._autoModerationService = autoModerationService;
    }

    public async authorNewPost(postPayload: PostCreationPayloadDto): Promise<Post> {
        const user = this.getUserFromRequest();
        // validate the post payload
        const postType = await this._dbContext.PostTypes.findPostTypeByName(
            postPayload.postTypeName
        );
        if (postType === undefined) throw new HttpException("Post type not found", 404);

        const postTags = new Array<PostTag>(postPayload.postTagNames.length);
        for (const i in postPayload.postTagNames) {
            const postTagName = postPayload.postTagNames[i];
            const foundPostTag = await this._dbContext.PostTags.findPostTagByName(postTagName);
            if (foundPostTag === undefined)
                throw new HttpException("Post tag not found: " + postTagName, 404);

            postTags[i] = foundPostTag;
        }

        // auto-moderation
        const wasOffending = await this._autoModerationService.checkForHateSpeech(
            postPayload.postTitle + postPayload.postContent
        );

        // if moderation passed, create post and return it.
        return await this._dbContext.Posts.addPost(
            new Post({
                postType: postType,
                postTags: postTags,
                postTitle: postPayload.postTitle,
                postContent: postPayload.postContent,
                authorUser: user,
                pending: wasOffending,
            }),
            postPayload.anonymous
        );
    }

    public async getQueeryOfTheDay(): Promise<Post> {
        const allPosts = await this._dbContext.Posts.findAll();
        if (allPosts.length === 0)
            throw new HttpException(
                "No posts found in the database. Please checkout this application's usage tutorials.",
                404
            );

        const queeryPosts: Post[] = [];
        for (const i in allPosts) {
            if (!allPosts[i].pending) continue;

            await allPosts[i].getDeletedProps();
            if (allPosts[i].deletedProps !== null) continue;

            await allPosts[i].getRestricted();
            if (allPosts[i].restrictedProps !== null) continue;

            await allPosts[i].getPostType();
            if (allPosts[i].postType.postTypeName === "Queery") {
                queeryPosts.push(allPosts[i]);
            }
        }

        if (queeryPosts.length === 0) throw new HttpException("No Queery posts found", 404);

        const queeryOfTheDayIndex = Math.floor(Math.random() * queeryPosts.length);
        return queeryPosts[queeryOfTheDayIndex];
    }

    public async findAllQueeries(sorted: null | postSortCallback): Promise<Post[]> {
        const queeries = await this._dbContext.Posts.findPostByPostType("queery");
        if (sorted !== null) {
            queeries.sort(sorted);
        }
        return queeries;
    }

    public async findAllStories(sorted: null | postSortCallback): Promise<Post[]> {
        const stories = await this._dbContext.Posts.findPostByPostType("story");
        if (sorted !== null) {
            stories.sort(sorted);
        }
        return stories;
    }

    public async findPostById(postId: string): Promise<Post> {
        const foundPost = await this._dbContext.Posts.findPostById(postId);
        if (foundPost === null) throw new HttpException("Post not found", 404);

        if (foundPost.pending)
            throw new HttpException("Post cannot be shown publicly due to striking policies", 403);

        await foundPost.getDeletedProps();
        if (foundPost.deletedProps !== null) throw new HttpException("Post was deleted", 404);

        await foundPost.getRestricted();
        if (foundPost.restrictedProps !== null) throw new HttpException("Post is restricted", 404);

        return await foundPost.toJSON();
    }

    public async markAsDeleted(postId: string): Promise<void> {
        const post = await this._dbContext.Posts.findPostById(postId);
        if (post === undefined) throw new Error("Post not found");

        await post.getDeletedProps();
        if (post.deletedProps !== null) throw new Error("Post already deleted");

        await post.getAuthorUser();

        await post.setDeletedProps(
            new DeletedProps({
                deletedAt: new Date().getTime(),
                deletedByUserId: post.authorUser.userId,
            })
        );
    }

    public async votePost(votePostPayload: VotePostPayloadDto): Promise<void> {
        const user = this.getUserFromRequest();

        const post = await this._dbContext.Posts.findPostById(votePostPayload.postId);
        if (post === undefined) throw new HttpException("Post not found", 404);

        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId })-[r:${UserToPostRelTypes.UPVOTES}|${UserToPostRelTypes.DOWN_VOTES}]->(p:Post { postId: $postId })
            `,
            {
                userId: user.userId,
                postId: votePostPayload.postId,
            }
        );

        if (queryResult.records.length > 0) {
            const relType = queryResult.records[0].get("r").type;
            if (
                relType === UserToPostRelTypes.UPVOTES &&
                votePostPayload.voteType === VoteType.UPVOTES
            ) {
                throw new HttpException("User already upvoted this post", 400);
            } else if (
                relType === UserToPostRelTypes.DOWN_VOTES &&
                votePostPayload.voteType === VoteType.DOWN_VOTES
            ) {
                throw new HttpException("User already downvoted this post", 400);
            } else {
                await this._dbContext.neo4jService.tryWriteAsync(
                    `
                    MATCH (u:User { userId: $userId })-[r:${relType}]->(p:Post { postId: $postId })
                    DELETE r
                    `,
                    {
                        userId: user.userId,
                        postId: votePostPayload.postId,
                    }
                );
            }
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (u:User { userId: $userId }), (p:Post { postId: $postId })
            MERGE (u)-[r:${votePostPayload.voteType}]->(p)
            `,
            {
                userId: user.userId,
                postId: votePostPayload.postId,
            }
        );
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new Error("User not found");
        return user;
    }
}
