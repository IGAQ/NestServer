import { Comment } from "../models";
import { CommentCreationPayloadDto } from "../models/commentCreationPayload.dto";

export interface ICommentsService {
    authorNewComment(commentPayload: CommentCreationPayloadDto): Promise<Comment>;

    findCommentById(commentId: string): Promise<Comment>;

    markAsPinned(commentId: string): Promise<void>;

    markAsDeleted(commentId: string): Promise<void>;
}