import { IPostTagsRepository } from "./postTags.repository.interface";
import { PostTag } from "../../models";

export class PostTagsRepository implements IPostTagsRepository {
    public getPostTagsByPostId(postId: string): Promise<PostTag[]> {
        throw new Error("Method not implemented.");
    }

    public async getPostTagById(postTagId: string): Promise<PostTag | undefined> {
        throw new Error("Method not implemented.");
    }
}
