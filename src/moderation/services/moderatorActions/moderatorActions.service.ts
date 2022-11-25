import { IModeratorActionsService } from "./moderatorActions.service.interface";
import { HttpException, Inject } from "@nestjs/common";
import { _$ } from "../../../_domain/injectableTokens";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { _ToSelfRelTypes, DeletedProps, RestrictedProps } from "../../../_domain/models/toSelf";
import { Comment } from "../../../comments/models";
import { Post } from "../../../posts/models";
import { ModerationPayloadDto } from "../../dtos/moderatorActions";
import { User } from "../../../users/models";

/**
 * This service is responsible for moderating posts and comments.
 * It is used by the moderator actions controller.
 * Notes:
 * - This service is not responsible to check if the user is a moderator. This is done by the guards used by controllers.
 * @see src/moderation/controllers/moderatorActions/moderatorActions.controller.ts
 */
export class ModeratorActionsService implements IModeratorActionsService {
    private readonly _dbContext: DatabaseContext;

    constructor(@Inject(_$.IDatabaseContext) dbContext: DatabaseContext) {
        this._dbContext = dbContext;
    }

    public async banUser(payload: ModerationPayloadDto): Promise<User> {
        throw new Error("Method not implemented.");
    }
    public async unbanUser(userId: string): Promise<User> {
        throw new Error("Method not implemented.");
    }

    /**
     * @description
     * This method is to remove the restriction of a comment. It will remove the restriction self-relation from the comment.
     * If the comment is already unrestricted, it will silently resolve the promise.
     * Notes:
     * * This method will not check if the end user has the permission to remove the restriction.
     * * This method will give a http 404 if the comment was not found.
     * @param commentId
     */
    public async allowComment(commentId: string): Promise<Comment> {
        const comment = await this.acquireComment(commentId);

        await comment.getRestricted();
        if (!comment.restrictedProps) {
            return comment;
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (c:Comment { commentId: $commentId })-[r:${_ToSelfRelTypes.RESTRICTED}]->(c)
                DELETE r
            `,
            { commentId }
        );

        return comment;
    }

    /**
     * @description
     * This method is to remove the restriction of a post. It will remove the restriction self-relation from the post.
     * If the post is already unrestricted, it will silently resolve the promise.
     * Notes:
     * * This method will not check if the end user has the permission to remove the restriction.
     * * This method will give a http 404 if the post was not found.
     * @param postId
     */
    public async allowPost(postId: string): Promise<Post> {
        const post = await this.acquirePost(postId);

        await post.getRestricted();
        if (!post.restrictedProps) {
            return;
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (p:Post { postId: $postId })-[r:${_ToSelfRelTypes.RESTRICTED}]->(p)
                DELETE r
            `,
            { postId }
        );

        return;
    }

    /**
     * @description
     * This method will mark a comment as deleted. It will add a self-relation to the comment.
     * @param payload
     */
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
        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (c:Comment { commentId: $commentId })-[r:${_ToSelfRelTypes.DELETED} {
                deletedAt: $deletedAt,
                moderatorId: $moderatorId,
                reason: $reason
            }]->(c)
        `,
            {
                commentId: payload.id,
                deletedAt: deletedProps.deletedAt,
                moderatorId: deletedProps.moderatorId,
                reason: deletedProps.reason,
            }
        );
        comment.deletedProps = deletedProps;

        return comment;
    }

    /**
     * @description
     * This method will mark a post as deleted. It will add a self-relation to the post.
     * @param payload
     */
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
        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (p:Post { postId: $postId })-[r:${_ToSelfRelTypes.DELETED} {
                deletedAt: $deletedAt,
                deletedByUserId: $deletedByUserId
            }]->(p)
        `,
            {
                postId: payload.id,
                deletedAt: deletedProps.deletedAt,
                moderatorId: deletedProps.moderatorId,
                reason: deletedProps.reason,
            }
        );
        post.deletedProps = deletedProps;

        return post;
    }

    /**
     * @description
     * This method will mark a comment as restricted. It will add a self-relation to the comment.
     * @param payload
     */
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
        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (c:Comment { commentId: $commentId })-[r:${_ToSelfRelTypes.RESTRICTED} {
                restrictedAt: $restrictedAt,
                moderatorId: $moderatorId,
                reason: $reason
            }]->(c)
        `,
            {
                commentId: payload.id,
                restrictedAt: restrictedProps.restrictedAt,
                moderatorId: restrictedProps.moderatorId,
                reason: restrictedProps.reason,
            }
        );
        comment.restrictedProps = restrictedProps;

        return comment;
    }

    /**
     * @description
     * This method will mark a post as restricted. It will add a self-relation to the post.
     * @param payload
     */
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
        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (p:Post postId: $postId })-[r:${_ToSelfRelTypes.RESTRICTED} {
                restrictedAt: $restrictedAt,
                moderatorId: $moderatorId,
                reason: $reason
            }]->(p)
        `,
            {
                postId: payload.id,
                restrictedAt: restrictedProps.restrictedAt,
                moderatorId: restrictedProps.moderatorId,
                reason: restrictedProps.reason,
            }
        );
        post.restrictedProps = restrictedProps;

        return post;
    }

    /**
     * @description
     * This method will mark a comment as undeleted. It will remove the self-relation from the comment.
     * @param commentId
     */
    public async undeleteComment(commentId: string): Promise<Comment> {
        const comment = await this.acquireComment(commentId);

        await comment.getDeletedProps();
        if (!comment.deletedProps) {
            return comment;
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (c:Comment { commentId: $commentId })-[r:${_ToSelfRelTypes.DELETED}]->(c)
                DELETE r
            `,
            { commentId }
        );
        comment.deletedProps = null;

        return comment;
    }

    /**
     * @description
     * This method will mark a post as undeleted. It will remove the self-relation from the post.
     * @param postId
     */
    public async undeletePost(postId: string): Promise<Post> {
        const post = await this.acquirePost(postId);

        await post.getDeletedProps();
        if (!post.deletedProps) {
            return post;
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (p:Post { postId: $postId })-[r:${_ToSelfRelTypes.DELETED}]->(p)
                DELETE r
            `,
            { postId }
        );
        post.deletedProps = null;

        return post;
    }

    /**
     * @description
     * This method is to find a comment from the database and throw an error if it does not exist. if it does exist, it will return the comment.
     * @param commentId
     * @private
     */
    private async acquireComment(commentId: string): Promise<Comment> {
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
    private async acquirePost(postId: string): Promise<Post> {
        const post = await this._dbContext.Posts.findPostById(postId);
        if (!post) {
            throw new HttpException("Post not found", 404);
        }
        return post;
    }
}
