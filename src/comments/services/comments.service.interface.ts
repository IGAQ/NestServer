import { Comment } from "../models";
import { CommentCreationPayloadDto } from "../models/commentCreationPayload.dto";

export interface ICommentsService {
    authorNewComment(commentPayload: CommentCreationPayloadDto): Promise<Comment>;
}