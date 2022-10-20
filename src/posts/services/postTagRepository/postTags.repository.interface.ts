import { PostTag } from "../../models";

export interface IPostTagsRepository {
    getPostTagsByPostId(postId: string): Promise<PostTag[]>;

    getPostTagById(postTagId: string): Promise<PostTag | undefined>;
}