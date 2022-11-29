import { Comment } from "../../../comments/models";
import { Post } from "../../../posts/models";

export interface IUserHistoryService {
    getPostsHistoryByUsername(username: string): Promise<Post[]>;

    getCommentsHistoryByUsername(username: string): Promise<Comment[]>;

    getTotalLikesByUsername(username: string): Promise<number>;
}
