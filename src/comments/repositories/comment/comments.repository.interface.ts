import { DeletedProps, RestrictedProps } from "../../../_domain/models/toSelf";
import { Comment } from "../../models";

export interface ICommentsRepository {
    findAll(): Promise<Comment[]>;

    findCommentById(commentId: string): Promise<Comment | undefined>;

    updateComment(comment: Comment): Promise<void>;

    addCommentToComment(comment: Comment): Promise<Comment>;

    addCommentToPost(comment: Comment): Promise<Comment>;

    deleteComment(commentId: string): Promise<void>;

    restrictComment(commentId: string, restrictedProps: RestrictedProps): Promise<void>;

    unrestrictComment(commentId: string): Promise<void>;

    markAsDeleted(commentId: string, deletedProps: DeletedProps): Promise<void>;
    removeDeletedMark(commentId: string): Promise<void>;
}
