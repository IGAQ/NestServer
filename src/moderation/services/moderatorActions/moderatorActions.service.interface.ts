import { Post } from "../../../posts/models";
import { Comment } from "../../../comments/models";
import { ModerationPayloadDto } from "../../dtos/moderatorActions";

export interface IModeratorActionsService {
    allowPost(postId: string): Promise<Post>;
    restrictPost(payload: ModerationPayloadDto): Promise<Post>;

    allowComment(commentId: string): Promise<Comment>;
    restrictComment(payload: ModerationPayloadDto): Promise<Comment>;

    deletePost(payload: ModerationPayloadDto): Promise<Post>;
    undeletePost(postId: string): Promise<Post>;

    deleteComment(payload: ModerationPayloadDto): Promise<Comment>;
    undeleteComment(commentId: string): Promise<Comment>;
}
