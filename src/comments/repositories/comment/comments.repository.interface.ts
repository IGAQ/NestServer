import { RestrictedProps } from "../../../_domain/models/toSelf";
import { Comment } from "../../models";

export interface ICommentsRepository {
    findAll(): Promise<Comment[]>;

    findCommentById(commentId: string): Promise<Comment | undefined>;

    addCommentToComment(comment: Comment): Promise<Comment>;

    addCommentToPost(comment: Comment): Promise<Comment>;

    deleteComment(commentId: string): Promise<void>;

    restrictComment(commentId: string, restrictedProps: RestrictedProps): Promise<void>;

    unrestrictComment(commentId: string): Promise<void>;
}
