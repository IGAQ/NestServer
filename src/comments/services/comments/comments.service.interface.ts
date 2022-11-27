import { Comment } from "../../models";
import { VoteCommentPayloadDto, CommentCreationPayloadDto } from "../../dtos";

export interface ICommentsService {
    authorNewComment(commentPayload: CommentCreationPayloadDto): Promise<Comment>;

    findCommentById(commentId: UUID): Promise<Comment>;

    findNestedCommentsByCommentId(
        commentId: UUID,
        topLevelLimit: number,
        nestedLimit: number,
        nestedLevel: number
    ): Promise<Comment[]>;

    voteComment(votePayload: VoteCommentPayloadDto): Promise<void>;

    markAsPinned(commentId: UUID): Promise<void>;
}
