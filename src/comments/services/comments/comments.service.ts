import { HttpException, Inject, Injectable, Logger, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { IAutoModerationService } from "../../../moderation/services/autoModeration/autoModeration.service.interface";
import { Post } from "../../../posts/models";
import { PostToCommentRelTypes } from "../../../posts/models/toComment";
import { IPostsService } from "../../../posts/services/posts/posts.service.interface";
import { User } from "../../../users/models";
import { UserToCommentRelTypes } from "../../../users/models/toComment";
import { VoteProps } from "../../../users/models/toPost";
import { _$ } from "../../../_domain/injectableTokens";
import { VoteType } from "../../../_domain/models/enums";
import { CommentCreationPayloadDto, VoteCommentPayloadDto } from "../../dtos";
import { Comment } from "../../models";
import { CommentToSelfRelTypes } from "../../models/toSelf";
import { ICommentsService } from "./comments.service.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CommentGotPinnedByAuthorEvent, CommentGotVoteEvent, NewCommentEvent } from "../../events";
import { EventTypes } from "../../../_domain/eventTypes";

@Injectable({ scope: Scope.REQUEST })
export class CommentsService implements ICommentsService {
    private readonly _logger = new Logger(CommentsService.name);

    private readonly _eventEmitter: EventEmitter2;
    private readonly _request: Request;
    private readonly _dbContext: DatabaseContext;
    private readonly _autoModerationService: IAutoModerationService;
    private readonly _postService: IPostsService;

    constructor(
        eventEmitter: EventEmitter2,
        @Inject(REQUEST) request: Request,
        @Inject(_$.IDatabaseContext) databaseContext: DatabaseContext,
        @Inject(_$.IAutoModerationService) autoModerationService: IAutoModerationService,
        @Inject(_$.IPostsService) postsService: IPostsService
    ) {
        this._eventEmitter = eventEmitter;
        this._request = request;
        this._dbContext = databaseContext;
        this._autoModerationService = autoModerationService;
        this._postService = postsService;
    }

    public async authorNewComment(commentPayload: CommentCreationPayloadDto): Promise<Comment> {
        const user = this.getUserFromRequest();

        // auto-moderation
        const wasOffending = await this._autoModerationService.checkForHateSpeech(
            commentPayload.commentContent
        );

        // if moderation passed, create comment and return it.
        if (commentPayload.isPost) {
            const foundPost = await this._postService.findPostById(commentPayload.parentId);
            const createdComment = await this._dbContext.Comments.addCommentToPost(
                new Comment({
                    commentContent: commentPayload.commentContent,
                    authorUser: user,
                    pending: wasOffending,
                    updatedAt: new Date().getTime(),
                    parentId: foundPost.postId,
                })
            );
            try {
                await foundPost.getAuthorUser();
                await foundPost.getPostType();
                this._eventEmitter.emit(
                    EventTypes.NewCommentOnPost,
                    new NewCommentEvent({
                        subscriberId: foundPost.authorUser.userId,
                        username: user.username,
                        avatar: user.avatar,
                        commentContent: createdComment.commentContent,
                        postTypeName: foundPost.postType.postTypeName,
                    })
                );
            } catch (error) {
                this._logger.error(error);
            }

            return createdComment;
        }

        const foundParentComment = await this.findCommentById(commentPayload.parentId);
        const createdComment = await this._dbContext.Comments.addCommentToComment(
            new Comment({
                commentContent: commentPayload.commentContent,
                authorUser: user,
                pending: wasOffending,
                updatedAt: new Date().getTime(),
                parentId: commentPayload.parentId,
            })
        );
        this._eventEmitter.emit(
            EventTypes.NewCommentOnComment,
            new NewCommentEvent({
                subscriberId: foundParentComment.authorUser.userId,
                username: user.username,
                avatar: user.avatar,
                commentContent: createdComment.commentContent,
            })
        );

        return createdComment;
    }

    public async findCommentById(commentId: UUID): Promise<Comment> {
        const foundComment = await this._dbContext.Comments.findCommentById(commentId);
        if (!foundComment) {
            throw new HttpException("Comment not found", 404);
        }
        if (foundComment.pending) {
            throw new HttpException(
                "Comment cannot be shown publicly due to striking policies",
                403
            );
        }
        await foundComment.getDeletedProps();
        if (foundComment.deletedProps) {
            throw new HttpException("Comment was deleted", 404);
        }
        await foundComment.getRestricted();
        if (foundComment.restrictedProps) {
            throw new HttpException("Comment is restricted", 404);
        }

        return await foundComment.toJSON();
    }

    public async findNestedCommentsByCommentId(
        commentId: string,
        topLevelLimit: number,
        nestedLimit: number,
        nestedLevel: number
    ): Promise<Comment[]> {
        const foundComment = await this._dbContext.Comments.findCommentById(commentId);
        if (foundComment === null) throw new HttpException("Comment not found", 404);

        // level 0 means no nesting
        const comments = await foundComment.getChildrenComments(topLevelLimit);
        if (nestedLevel === 0) return comments;

        await this._postService.getNestedComments(comments, nestedLevel, nestedLimit);

        return comments;
    }

    public async voteComment(voteCommentPayload: VoteCommentPayloadDto): Promise<void> {
        const user = this.getUserFromRequest();

        const comment = await this._dbContext.Comments.findCommentById(
            voteCommentPayload.commentId
        );
        if (!comment) throw new HttpException("Comment not found", 404);

        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId })-[r:${UserToCommentRelTypes.UPVOTES}|${UserToCommentRelTypes.DOWN_VOTES}]->(c:Comment { commentId: $commentId })
            RETURN r
            `,
            {
                userId: user.userId,
                commentId: voteCommentPayload.commentId,
            }
        );

        if (queryResult.records.length > 0) {
            // user has already voted on this comment
            const relType = queryResult.records[0].get("r").type;

            // remove the existing vote
            await this._dbContext.neo4jService.tryWriteAsync(
                `
                    MATCH (u:User { userId: $userId })-[r:${relType}]->(c:Comment { commentId: $commentId })
                    DELETE r
                    `,
                {
                    userId: user.userId,
                    commentId: voteCommentPayload.commentId,
                }
            );

            // don't add a new vote if the user is removing their vote (stop)
            if (
                (relType === UserToCommentRelTypes.UPVOTES &&
                    voteCommentPayload.voteType === VoteType.UPVOTES) ||
                (relType === UserToCommentRelTypes.DOWN_VOTES &&
                    voteCommentPayload.voteType === VoteType.DOWN_VOTES)
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
            MATCH (u:User { userId: $userId }), (c:Comment { commentId: $commentId })
            MERGE (u)-[r:${voteCommentPayload.voteType} { votedAt: $votedAt }]->(c)
            `,
            {
                userId: user.userId,
                commentId: voteCommentPayload.commentId,

                votedAt: voteProps.votedAt,
            }
        );

        const eventType =
            voteCommentPayload.voteType === VoteType.UPVOTES
                ? EventTypes.CommentGotUpVote
                : EventTypes.CommentGotDownVote;

        // don't wait for the push notification.
        try {
            const [parentPost] = await this.findParentCommentRoot(comment.commentId);
            await parentPost.getAuthorUser();
            this._eventEmitter.emit(
                eventType,
                new CommentGotVoteEvent({
                    subscriberId: parentPost.authorUser.userId,
                    postId: parentPost.postId,
                    commentId: comment.commentId,
                    username: user.username,
                    avatar: user.avatar,
                })
            );
        } catch (error) {
            this._logger.error(error);
        }
    }

    public async markAsPinned(commentId: UUID): Promise<void> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (!comment) throw new HttpException("Comment not found", 404);

        const [parentPost] = await this.findParentCommentRoot(commentId);
        const user = this.getUserFromRequest();
        const isPinned = await this.checkIfAnyCommentIsPinned(parentPost);

        const postAuthor = await parentPost.getAuthorUser();

        if (postAuthor.userId !== user.userId) {
            throw new HttpException("User is not the author of the post", 403);
        }

        if (isPinned === true) {
            throw new HttpException("Post already has a pinned comment", 400);
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH  (p:Post { postId: $postId }), (c:Comment { commentId: $commentId })
            MERGE (p)-[:${PostToCommentRelTypes.PINNED_COMMENT}]->(c)
            `,
            {
                postId: parentPost.postId,
                commentId: commentId,
            }
        );

        try {
            await comment.getAuthorUser();
            this._eventEmitter.emit(
                EventTypes.CommentGotPinnedByAuthor,
                new CommentGotPinnedByAuthorEvent({
                    subscriberId: comment.authorUser.userId,
                    commentId,
                    commentContent: comment.commentContent,
                    postId: parentPost.postId,
                    username: user.username,
                    avatar: user.avatar,
                })
            );
        } catch (error) {
            this._logger.error(error);
        }
    }

    public async markAsUnpinned(commentId: UUID): Promise<void> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (!comment) throw new HttpException("Comment not found", 404);

        const [parentPost] = await this.findParentCommentRoot(commentId);
        const user = this.getUserFromRequest();

        const postAuthor = await parentPost.getAuthorUser();

        if (postAuthor.userId !== user.userId) {
            throw new HttpException("User is not the author of the post", 403);
        }

        const queryResult = await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH  (p:Post { postId: $postId })-[r:${PostToCommentRelTypes.PINNED_COMMENT}]->(c:Comment { commentId: $commentId })
            DELETE r
            `,
            {
                postId: parentPost.postId,
                commentId: commentId,
            }
        );

        // Checks if a change was made to the database (If the comment was unpinned)
        if (queryResult.summary.counters.containsUpdates() === false) {
            throw new HttpException("Comment is not pinned", 400);
        }
    }

    // gets the parent post of any nested comment of the post
    private async acquireParentPost(commentId: UUID): Promise<Post> {
        const parentPost = await this._dbContext.Comments.findParentPost(commentId);

        if (!parentPost) {
            throw new HttpException("Post not found", 404);
        }
        return parentPost;
    }

    // gets the root comment of any nested comment
    private async findParentCommentRoot(
        commentId: string,
        isNestedComment = false
    ): Promise<[Post, boolean]> {
        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            ` 
                MATCH (c:Comment { commentId: $commentId })-[:${CommentToSelfRelTypes.REPLIED}]->(commentParent:Comment)
                RETURN commentParent
            `,
            {
                commentId,
            }
        );
        if (queryResult.records.length > 0) {
            return await this.findParentCommentRoot(
                queryResult.records[0].get("commentParent").properties.commentId,
                true
            );
        } else {
            const rootComment = await this._dbContext.Comments.findCommentById(commentId);
            return [await this.acquireParentPost(rootComment.commentId), isNestedComment];
        }
    }

    private async checkIfAnyCommentIsPinned(post: Post): Promise<boolean> {
        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (p:Post { postId: $postId })-[:${PostToCommentRelTypes.PINNED_COMMENT}]->(c:Comment)
            RETURN c
            `,
            {
                postId: post.postId,
            }
        );
        return queryResult.records.length > 0;
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new HttpException("User not found", 404);
        return user;
    }
}
