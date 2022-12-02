import { HttpException, Inject, Injectable, Logger, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { Comment } from "../../../comments/models";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { IAutoModerationService } from "../../../moderation/services/autoModeration/autoModeration.service.interface";
import { User } from "../../../users/models";
import { UserToPostRelTypes, VoteProps } from "../../../users/models/toPost";
import { _$ } from "../../../_domain/injectableTokens";
import { VoteType } from "../../../_domain/models/enums";
import { PostCreationPayloadDto, VotePostPayloadDto } from "../../dtos";
import { Post, PostTag } from "../../models";
import { IPostsService, postSortCallback } from "./posts.service.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PostGotVoteEvent } from "../../events";
import { EventTypes } from "../../../_domain/eventTypes";

@Injectable({ scope: Scope.REQUEST })
export class PostsService implements IPostsService {
    private readonly _logger = new Logger(PostsService.name);

    private readonly _eventEmitter: EventEmitter2;
    private readonly _request: Request;
    private readonly _dbContext: DatabaseContext;
    private readonly _autoModerationService: IAutoModerationService;

    constructor(
        eventEmitter: EventEmitter2,
        @Inject(REQUEST) request: Request,
        @Inject(_$.IDatabaseContext) databaseContext: DatabaseContext,
        @Inject(_$.IAutoModerationService) autoModerationService: IAutoModerationService
    ) {
        this._eventEmitter = eventEmitter;
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

    public async getQueeriesOfTheDay(): Promise<Post[]> {
        let user: User = null;
        try {
            user = this.getUserFromRequest();
        } catch (e) {
            // do nothing
        }

        const allQueeries = await this._dbContext.Posts.findPostByPostType("queery");
        if (allQueeries.length === 0)
            throw new HttpException(
                "No posts found in the database. Please checkout this application's usage tutorials.",
                404
            );

        const queeries: Post[] = [];
        for (const i in allQueeries) {
            if (allQueeries[i].pending) continue;

            await allQueeries[i].getDeletedProps();
            if (allQueeries[i].deletedProps !== null) continue;

            await allQueeries[i].getRestricted();
            if (allQueeries[i].restrictedProps !== null) continue;

            allQueeries[i].totalComments = await this.getTotalComments(allQueeries[i]);

            allQueeries[i] = await allQueeries[i].toJSON({
                authenticatedUserId: user?.userId ?? undefined,
            });

            queeries.push(allQueeries[i]);
        }

        queeries.sort(
            (postA, postB) =>
                postA.totalComments + postA.totalVotes - (postB.totalComments + postB.totalVotes)
        );

        return queeries.slice(0, 5);
    }

    public async getStoriesOfTheDay(): Promise<Post[]> {
        let user: User = null;
        try {
            user = this.getUserFromRequest();
        } catch (e) {
            // do nothing
        }

        const allStories = await this._dbContext.Posts.findPostByPostType("story");
        if (allStories.length === 0)
            throw new HttpException(
                "No posts found in the database. Please checkout this application's usage tutorials.",
                404
            );

        const stories: Post[] = [];
        for (const i in allStories) {
            if (allStories[i].pending) continue;

            await allStories[i].getDeletedProps();
            if (allStories[i].deletedProps !== null) continue;

            await allStories[i].getRestricted();
            if (allStories[i].restrictedProps !== null) continue;

            allStories[i].totalComments = await this.getTotalComments(allStories[i]);

            allStories[i] = await allStories[i].toJSON({
                authenticatedUserId: user?.userId ?? undefined,
            });

            stories.push(allStories[i]);
        }

        stories.sort(
            (postA, postB) =>
                postA.totalComments + postA.totalVotes - (postB.totalComments + postB.totalVotes)
        );

        return stories.slice(0, 5);
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

    public async findPostById(postId: UUID): Promise<Post> {
        let foundPost = await this._dbContext.Posts.findPostById(postId);
        if (!foundPost) throw new HttpException("Post not found", 404);

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
        if (!foundPost) throw new HttpException("Post not found", 404);

        // level 0 means no nesting
        const comments = await foundPost.getComments(topLevelLimit);
        if (nestedLevel === 0) return comments;

        await this.getNestedComments(comments, nestedLevel, nestedLimit);

        return comments;
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
        if (!post) throw new HttpException("Post not found", 404);

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

        const eventType =
            votePostPayload.voteType === VoteType.UPVOTES
                ? EventTypes.PostGotUpVote
                : EventTypes.PostGotDownVote;

        try {
            await post.getAuthorUser();
            this._eventEmitter.emit(
                eventType,
                new PostGotVoteEvent({
                    subscriberId: post.authorUser.userId,
                    postId: post.postId,
                    username: user.username,
                    avatar: user.avatar,
                })
            );
        } catch (error) {
            this._logger.error(error);
        }
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new Error("User not found");
        return user;
    }
}
