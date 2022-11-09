import { Comment, VoteCommentPayloadDto } from "../models";
import { CommentCreationPayloadDto } from "../models/commentCreationPayload.dto";

export interface ICommentsService {
    authorNewComment(commentPayload: CommentCreationPayloadDto): Promise<Comment>;

    findCommentById(commentId: string): Promise<Comment>;

    voteComment(votePayload: VoteCommentPayloadDto): Promise<void>;

    markAsPinned(commentId: string): Promise<void>;

    markAsDeleted(commentId: string): Promise<void>;
}