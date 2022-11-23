import { HttpService } from "@nestjs/axios";
import { HttpException, Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { Post } from "../../../posts/models";
import { PostToCommentRelTypes } from "../../../posts/models/toComment";
import { User } from "../../../users/models";
import { UserToCommentRelTypes } from "../../../users/models/toComment";
import { _$ } from "../../../_domain/injectableTokens";
import { CommentCreationPayloadDto, VoteCommentPayloadDto } from "../../dtos";
import { Comment } from "../../models";
import { CommentToSelfRelTypes, DeletedProps } from "../../models/toSelf";
import { ICommentsService } from "./comments.service.interface";
import { IAutoModerationService } from "../../../moderation/services/autoModeration/autoModeration.service.interface";
import { IPostsService } from "../../../posts/services/posts/posts.service.interface";
import { VoteType } from "../../../_domain/models/enums";
import { VoteProps } from "../../../users/models/toPost";

@Injectable({ scope: Scope.REQUEST })
export class CommentsService implements ICommentsService {
    private readonly _request: Request;
    private readonly _dbContext: DatabaseContext;
    private readonly _autoModerationService: IAutoModerationService;
    private readonly _postService: IPostsService;

    constructor(
        @Inject(REQUEST) request: Request,
        @Inject(_$.IDatabaseContext) databaseContext: DatabaseContext,
        @Inject(_$.IAutoModerationService) autoModerationService: IAutoModerationService,
        @Inject(_$.IPostsService) postsService: IPostsService
    ) {
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
            return await this._dbContext.Comments.addCommentToPost(
                new Comment({
                    commentContent: commentPayload.commentContent,
                    authorUser: user,
                    pending: wasOffending,
                    updatedAt: new Date().getTime(),
                    parentId: commentPayload.parentId,
                })
            );
        }

        return await this._dbContext.Comments.addCommentToComment(
            new Comment({
                commentContent: commentPayload.commentContent,
                authorUser: user,
                pending: wasOffending,
                updatedAt: new Date().getTime(),
                parentId: commentPayload.parentId,
            })
        );
    }

    public async findCommentById(commentId: string): Promise<Comment> {
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
    }

    public async markAsPinned(commentId: string): Promise<void> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (!comment) throw new HttpException("Comment not found", 404);

        const user = this.getUserFromRequest();

        const [parentPost] = await this.findParentCommentRoot(commentId);

        if (parentPost.authorUser.userId !== user.userId) {
            throw new HttpException("User is not the author of the post", 403);
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (c:Comment { commentId: $commentId })
            SET c.pinned = true
            `,
            {
                commentId,
            }
        );
    }

    public async markAsDeleted(commentId: string): Promise<void> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (!comment) {
            throw new HttpException("Comment not found", 404);
        }

        await comment.getDeletedProps();
        if (comment.deletedProps) {
            throw new HttpException("Comment was already deleted", 400);
        }

        await comment.getAuthorUser();

        await comment.setDeletedProps(
            new DeletedProps({
                deletedAt: new Date().getTime(),
                deletedByUserId: comment.authorUser.userId,
            })
        );
    }

    // gets the parent post of any nested comment of the post
    private async findParentPost(commentId: string): Promise<Post> {
        const parentPost = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (p:Post)-[:${PostToCommentRelTypes.HAS_COMMENT}]->(c:Comment { commentId: $commentId })
            RETURN p
            `,
            {
                commentId,
            }
        );

        if (parentPost.records.length === 0) {
            throw new HttpException("Post not found", 404);
        }
        return parentPost.records[0].get("p");
    }

    // gets the parent comment of any nested comment of the post
    private async findComment(commentId: string): Promise<boolean> {
        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (c:Comment { commentId: $commentId })-[:${CommentToSelfRelTypes.REPLIED}]->(commentParent:Comment)
            RETURN commentParent
            `,
            {
                commentId,
            }
        );
        return queryResult.records[0].get("commentParent");
    }

    // gets the root comment of any nested comment
    private async findParentCommentRoot(
        commentId: string,
        isNestedComment = false
    ): Promise<[Post, boolean]> {
        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            ` 
                MATCH (c:Comment { commentId: $commentId })-[:${CommentToSelfRelTypes.REPLIED}]->(c:Comment)
                 RETURN c
                 `,
            {
                commentId,
            }
        );
        if (queryResult.records.length > 0) {
            return await this.findParentCommentRoot(
                queryResult.records[0].get("c").properties.commentId,
                true
            );
        } else {
            const rootComment = await this._dbContext.Comments.findCommentById(commentId);
            return [await this.findParentPost(rootComment.commentId), isNestedComment];
        }
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new Error("User not found");
        return user;
    }
}
