import { PostTag } from "../../models";

export interface IPostTagsRepository {
    findAll(): Promise<PostTag[]>;

    findPostTagByTagId(tagId: string): Promise<PostTag | undefined>;

    findPostTagByName(tagName: string): Promise<PostTag | undefined>;

    addPostTag(postTag: PostTag): Promise<PostTag>;

    updatePostTag(postTag: PostTag): Promise<void>;

    deletePostTag(postTagId: string): Promise<void>;
}
