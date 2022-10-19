import { PostTag } from "../../models";

export interface IPostTagsRepository {
    getPostTagsByPostId(postId: string): Promise<PostTag[]>;
}