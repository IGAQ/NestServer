import { Post } from "../../../posts/models";
import { Comment } from "../../../comments/models";
import { ModerationPayloadDto } from "../../dtos/moderatorActions";

export interface IModeratorActionsService {
    /**
     * Updates the pending status of a post, and makes it visible to the public.
     * @param postId
     */
    allowPost(postId: UUID): Promise<Post>;

    /**
     * Restricts a post by an adding a self relationship to the post.
     * @param payload
     */
    restrictPost(payload: ModerationPayloadDto): Promise<Post>;
    /**
     * Removes the restriction of a post. It will remove the restriction self-relation from the post.
     * If the post is already unrestricted, it will silently resolve the promise.
     * Notes:
     * * This method will not check if the end user has the permission to remove the restriction.
     * * This method will give a http 404 if the post was not found.
     * @param postId
     */
    unrestrictPost(postId: UUID): Promise<Post>;

    /**
     * Updates the pending status of a comment, and makes it visible to the public.
     * @param commentId
     */
    allowComment(commentId: UUID): Promise<Comment>;

    /**
     * Restricts a post by an adding a self relationship to the post.
     * @param payload
     */
    restrictComment(payload: ModerationPayloadDto): Promise<Comment>;
    /**
     * Removes the restriction of a comment. It will remove the restriction self-relation from the comment.
     * If the comment is already unrestricted, it will silently resolve the promise.
     * Notes:
     * * This method will not check if the end user has the permission to remove the restriction.
     * * This method will give a http 404 if the comment was not found.
     * @param commentId
     */
    unrestrictComment(commentId: UUID): Promise<Comment>;

    /**
     * Adds the mark of "deleted" to the post.
     * @param payload
     */
    deletePost(payload: ModerationPayloadDto): Promise<Post>;
    /**
     * Removes the mark of "deleted" from the post.
     * @param postId
     */
    undeletePost(postId: UUID): Promise<Post>;

    /**
     * Adds the mark of "deleted" to the comment.
     * @param payload
     */
    deleteComment(payload: ModerationPayloadDto): Promise<Comment>;
    /**
     * Removes the mark of deleted from a comment.
     * @param commentId
     */
    undeleteComment(commentId: UUID): Promise<Comment>;

    /**
     * Bans a user. A banned user cannot post, comment, or vote.
     * TODO:
     * - Implement this.
     * - Somehow add these actions to a history of actions records, so that it can be tracked and analyzed in the future.
     *   - This will be a stretch goal. For now, we will just ban the user by adding a self relationship to the user node.
     * @param payload
     */
    banUser(payload: ModerationPayloadDto): Promise<void>;
    /**
     * Unbans a user.
     * TODO:
     * - Implement this.
     * - Somehow add these actions to a history of actions records, so that it can be tracked and analyzed in the future.
     *   - This will be a stretch goal. For now, we will just unban the user by removing the self relationship to the user node.
     * @param userId
     */
    unbanUser(userId: UUID): Promise<void>;
}
