import { RestrictedProps } from "../../../_domain/models/toSelf";
import { Comment } from "../../models";

export interface ICommentsRepository {
    findAll(): Promise<Comment[]>;

    findCommentById(commentId: string): Promise<Comment | undefined>;

    findChildrenComments(parentId: string): Promise<Comment[]>;

    addComment(comment: Comment): Promise<Comment>;

    deleteComment(commentId: string): Promise<void>;

    restrictComment(commentId: string, restrictedProps: RestrictedProps): Promise<void>;

    unrestrictComment(commentId: string): Promise<void>;
}