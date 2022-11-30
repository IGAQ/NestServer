import { IModeratorActionsService } from "./moderatorActions.service.interface";
import { HttpException, Inject, Injectable, Scope } from "@nestjs/common";
import { _$ } from "../../../_domain/injectableTokens";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { DeletedProps, RestrictedProps } from "../../../_domain/models/toSelf";
import { Comment } from "../../../comments/models";
import { Post } from "../../../posts/models";
import { ModerationPayloadDto } from "../../dtos/moderatorActions";
import { GotBannedProps } from "../../../users/models/toSelf";

/**
 * This service is responsible for moderating posts and comments.
 * It is used by the moderator actions controller.
 * Notes:
 * - This service is not responsible to check if the user is a moderator. This is done by the guards used by controllers.
 * @see src/moderation/controllers/moderatorActions/moderatorActions.controller.ts
 */
@Injectable({ scope: Scope.DEFAULT })
export class ModeratorActionsService implements IModeratorActionsService {
    private readonly _dbContext: DatabaseContext;

    constructor(@Inject(_$.IDatabaseContext) dbContext: DatabaseContext) {
        this._dbContext = dbContext;
    }

    public async banUser(payload: ModerationPayloadDto): Promise<void> {
        const banProps = new GotBannedProps({
            bannedAt: Date.now(),
            moderatorId: payload.moderatorId,
            reason: payload.reason,
        });
        await this._dbContext.Users.banUser(payload.id, banProps);
        return;
    }

    public async unbanUser(userId: UUID): Promise<void> {
        const user = await this._dbContext.Users.findUserById(userId);
        if (!user) {
            throw new HttpException("User not found", 404);
        }

        await user.getGotBannedProps();
        if (!user.gotBannedProps) {
            throw new HttpException("User is not banned", 400);
        }

        await this._dbContext.Users.addPreviouslyBanned(userId, user.gotBannedProps);

        await this._dbContext.Users.unbanUser(userId);
        return;
    }

    public async unrestrictComment(commentId: UUID): Promise<Comment> {
        const comment = await this.acquireComment(commentId);

        await comment.getRestricted();
        if (!comment.restrictedProps) {
            return comment;
        }

        await this._dbContext.Comments.unrestrictComment(commentId);
        comment.restrictedProps = null;

        return comment;
    }

    public async unrestrictPost(postId: UUID): Promise<Post> {
        const post = await this.acquirePost(postId);

        await post.getRestricted();
        if (!post.restrictedProps) {
            return post;
        }

        await this._dbContext.Posts.unrestrictPost(postId);
        post.restrictedProps = null;

        return post;
    }

    public async deleteComment(payload: ModerationPayloadDto): Promise<Comment> {
        const comment = await this.acquireComment(payload.id);

        await comment.getDeletedProps();
        if (comment.deletedProps) {
            return comment;
        }

        const deletedProps = new DeletedProps({
            deletedAt: Date.now(),
            moderatorId: payload.moderatorId,
            reason: payload.reason,
        });
        await this._dbContext.Comments.markAsDeleted(payload.id, deletedProps);
        comment.deletedProps = deletedProps;

        return comment;
    }

    public async deletePost(payload: ModerationPayloadDto): Promise<Post> {
        const post = await this.acquirePost(payload.id);

        await post.getDeletedProps();
        if (post.deletedProps) {
            return post;
        }

        const deletedProps = new DeletedProps({
            deletedAt: Date.now(),
            moderatorId: payload.moderatorId,
            reason: payload.reason,
        });
        await this._dbContext.Posts.markAsDeleted(payload.id, deletedProps);
        post.deletedProps = deletedProps;

        return post;
    }

    public async restrictComment(payload: ModerationPayloadDto): Promise<Comment> {
        const comment = await this.acquireComment(payload.id);

        await comment.getRestricted();
        if (comment.restrictedProps) {
            return comment;
        }

        const restrictedProps = new RestrictedProps({
            restrictedAt: Date.now(),
            moderatorId: payload.moderatorId,
            reason: payload.moderatorId,
        });
        await this._dbContext.Comments.restrictComment(payload.id, restrictedProps);
        comment.restrictedProps = restrictedProps;

        return comment;
    }

    public async restrictPost(payload: ModerationPayloadDto): Promise<Post> {
        const post = await this.acquirePost(payload.id);

        await post.getRestricted();
        if (post.restrictedProps) {
            return post;
        }

        const restrictedProps = new RestrictedProps({
            restrictedAt: Date.now(),
            moderatorId: payload.moderatorId,
            reason: payload.moderatorId,
        });
        await this._dbContext.Posts.restrictPost(payload.id, restrictedProps);
        post.restrictedProps = restrictedProps;

        return post;
    }

    public async restoreComment(commentId: UUID): Promise<Comment> {
        const comment = await this.acquireComment(commentId);

        await comment.getDeletedProps();
        if (!comment.deletedProps) {
            return comment;
        }

        await this._dbContext.Comments.removeDeletedMark(commentId);
        comment.deletedProps = null;

        return comment;
    }

    public async restorePost(postId: UUID): Promise<Post> {
        const post = await this.acquirePost(postId);

        await post.getDeletedProps();
        if (!post.deletedProps) {
            return post;
        }

        await this._dbContext.Posts.removeDeletedMark(postId);
        post.deletedProps = null;

        return post;
    }

    public async allowComment(commentId: UUID): Promise<Comment> {
        const comment = await this.acquireComment(commentId);

        if (!comment.pending) {
            return comment;
        }

        comment.pending = false;
        await this._dbContext.Comments.updateComment(comment);

        return comment;
    }

    public async allowPost(postId: UUID): Promise<Post> {
        const post = await this.acquirePost(postId);

        if (!post.pending) {
            return post;
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (p:Post { postId: $postId }) 
                SET p.pending = false
            `,
            {
                postId,
            }
        );
        post.pending = false;

        return post;
    }

    /**
     * @description
     * This method is to find a comment from the database and throw an error if it does not exist. if it does exist, it will return the comment.
     * @param commentId
     * @private
     */
    private async acquireComment(commentId: UUID): Promise<Comment> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (!comment) {
            throw new HttpException("Comment not found", 404);
        }
        return comment;
    }

    /**
     * @description
     * This method is to find a post from the database and throw an error if it does not exist. if it does exist, it will return the post.
     * @param postId
     * @private
     */
    private async acquirePost(postId: UUID): Promise<Post> {
        const post = await this._dbContext.Posts.findPostById(postId);
        if (!post) {
            throw new HttpException("Post not found", 404);
        }
        return post;
    }
}
