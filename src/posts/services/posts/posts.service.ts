import { HttpException, Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { Comment } from "../../../comments/models";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { IAutoModerationService } from "../../../moderation/services/autoModeration/autoModeration.service.interface";
import { PostToCommentRelTypes } from "../../../posts/models/toComment";
import { User } from "../../../users/models";
import { UserToPostRelTypes, VoteProps } from "../../../users/models/toPost";
import { _$ } from "../../../_domain/injectableTokens";
import { VoteType } from "../../../_domain/models/enums";
import { PostCreationPayloadDto, VotePostPayloadDto } from "../../dtos";
import { Post, PostTag } from "../../models";
import { IPostsService, postSortCallback } from "./posts.service.interface";

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

    public async findAllQueeries(): Promise<Post[]> {
        const queeries = await this._dbContext.Posts.findPostByPostType("queery");
        return this.decoratePosts(queeries, (postA, postB) => postB.createdAt - postA.createdAt);
    }

    public async findAllStories(): Promise<Post[]> {
        const stories = await this._dbContext.Posts.findPostByPostType("story");
        return this.decoratePosts(stories, (postA, postB) => postB.createdAt - postA.createdAt);
    }

    private async decoratePosts(posts: Post[], sorted: null | postSortCallback): Promise<Post[]> {
        posts = await Promise.all(
            posts.map(async post => {
                post.totalComments = await this.getTotalComments(post);
                return post;
            })
        );
        if (sorted !== null) {
            posts.sort(sorted);
        }
        return posts;
    }

    private async getTotalComments(post: Post, comments = null, result = 0): Promise<number> {
        if (comments === null) {
            comments = await this.findNestedCommentsByPostId(post.postId, 0, 0, Infinity);
        }

        if (comments.length === 0) return result;
        result += comments.length;
        for (const comment of comments) {
            result = await this.getTotalComments(post, comment.childComments ?? [], result);
        }
        return result;
    }

    public async findPostById(postId: string): Promise<Post> {
        let foundPost = await this._dbContext.Posts.findPostById(postId);
        if (foundPost === null) throw new HttpException("Post not found", 404);

        if (foundPost.pending)
            throw new HttpException(
                "Post cannot be shown publicly at the moment. please try again later.",
                403
            );

        foundPost = (await this.decoratePosts([foundPost], null))[0];

        return foundPost;
    }

    public async findNestedCommentsByPostId(
        postId: UUID,
        topLevelLimit: number,
        nestedLimit: number,
        nestedLevel: number
    ): Promise<Comment[]> {
        const foundPost = await this._dbContext.Posts.findPostById(postId);
        if (foundPost === null) throw new HttpException("Post not found", 404);

        // level 0 means no nesting
        const comments = await foundPost.getComments(topLevelLimit);
        if (nestedLevel === 0) return comments;

        await this.getNestedComments(comments, nestedLevel, nestedLimit);

        return comments;
    }

    public async checkForPinnedComment(postId: UUID): Promise<Comment | null> {
        const foundPost = await this._dbContext.Posts.findPostById(postId);
        if (foundPost === null) throw new HttpException("Post not found", 404);

        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `MATCH (p:Post {postId: $postId})-[:${PostToCommentRelTypes.PINNED_COMMENT}]->(c:Comment)
            RETURN c`,
            {
                postId: postId,
            }
        )
        if (queryResult.records.length === 0) return null;
        return new Comment(queryResult.records[0].get("c").properties);
    }

    /**
     * Recursively gets the total number of every comment's child comments that are **available**.
     * @param comment
     * @param result
     * @private
     */
    private async getTotalCommentsByComment(comment: Comment, result = 0): Promise<number> {
        if (!comment.childComments || comment.childComments.length === 0) return result;
        result += comment.childComments.length;
        for (const childComment of comment.childComments) {
            result = await this.getTotalCommentsByComment(childComment, result);
            childComment.totalComments = await this.getTotalCommentsByComment(childComment, 0);
        }
        return result;
    }

    public async getNestedComments(
        comments: Comment[],
        nestedLevel: number,
        nestedLimit: number
    ): Promise<void> {
        if (nestedLevel === 0) return;
        for (const i in comments) {
            const comment: Comment = comments[i];
            await comment.getChildrenComments(nestedLimit);
            // comment.totalComments = await this.getTotalCommentsByComment(comment);
            await this.getNestedComments(comment.childComments, nestedLevel - 1, nestedLimit);
        }
    }

    public async votePost(votePostPayload: VotePostPayloadDto): Promise<void> {
        const user = this.getUserFromRequest();

        const post = await this._dbContext.Posts.findPostById(votePostPayload.postId);
        if (post === undefined) throw new HttpException("Post not found", 404);

        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId })-[r:${UserToPostRelTypes.UPVOTES}|${UserToPostRelTypes.DOWN_VOTES}]->(p:Post { postId: $postId }) 
            RETURN r
            `,
            {
                userId: user.userId,
                postId: votePostPayload.postId,
            }
        );

        if (queryResult.records.length > 0) {
            // user has already voted on this post
            const relType = queryResult.records[0].get("r").type;

            // remove the existing vote
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

            // don't add a new vote if the user is removing their vote (stop)
            if (
                (relType === UserToPostRelTypes.UPVOTES &&
                    votePostPayload.voteType === VoteType.UPVOTES) ||
                (relType === UserToPostRelTypes.DOWN_VOTES &&
                    votePostPayload.voteType === VoteType.DOWN_VOTES)
            ) {
                return;
            }
        }

        // add the new vote
        const voteProps = new VoteProps({
            votedAt: new Date().getTime(),
        });
        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (u:User { userId: $userId }), (p:Post { postId: $postId })
            MERGE (u)-[r:${votePostPayload.voteType} { votedAt: $votedAt }]->(p)
            `,
            {
                userId: user.userId,
                postId: votePostPayload.postId,

                votedAt: voteProps.votedAt,
            }
        );
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new Error("User not found");
        return user;
    }
}
