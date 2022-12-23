import { CommentCreationPayloadDto, VoteCommentPayloadDto } from "../../dtos";
import { Comment } from "../../models";
import { Post } from "../../../posts/models";

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

    markAsUnpinned(commentId: UUID): Promise<void>;
}
