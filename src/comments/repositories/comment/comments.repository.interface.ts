import { DeletedProps, RestrictedProps } from "../../../_domain/models/toSelf";
import { Comment } from "../../models";
import { Post } from "../../../posts/models";

export interface ICommentsRepository {
    findAll(): Promise<Comment[]>;

    findCommentById(commentId: UUID): Promise<Comment | undefined>;

    updateComment(comment: Comment): Promise<void>;

    addCommentToComment(comment: Comment): Promise<Comment>;

    addCommentToPost(comment: Comment): Promise<Comment>;

    deleteComment(commentId: UUID): Promise<void>;

    restrictComment(commentId: UUID, restrictedProps: RestrictedProps): Promise<void>;

    unrestrictComment(commentId: UUID): Promise<void>;

    markAsDeleted(commentId: UUID, deletedProps: DeletedProps): Promise<void>;
    removeDeletedMark(commentId: UUID): Promise<void>;

    findParentPost(commentId: UUID): Promise<Post | undefined>;
}
