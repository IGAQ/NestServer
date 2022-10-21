import { PostTag } from "../../models";

export interface IPostTagsRepository {
    findAll(): Promise<PostTag[]>;

    getPostTagsByPostId(postId: string): Promise<PostTag[]>;

    getPostTagByTagId(tagId: string): Promise<PostTag | undefined>;

    addPostTag(postTag: PostTag): Promise<PostTag>;

    updatePostTag(postTag: PostTag): Promise<void>;

    deletePostTag(postTagId: string): Promise<void>;
}

