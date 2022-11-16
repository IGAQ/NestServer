import { Comment } from "../../models";
import { VoteCommentPayloadDto, CommentCreationPayloadDto } from "../../dtos";

export interface ICommentsService {
    authorNewComment(commentPayload: CommentCreationPayloadDto): Promise<Comment>;

    findCommentById(commentId: string): Promise<Comment>;

    voteComment(votePayload: VoteCommentPayloadDto): Promise<void>;

    markAsPinned(commentId: string): Promise<void>;

    markAsDeleted(commentId: string): Promise<void>;
}