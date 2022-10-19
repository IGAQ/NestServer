import { IPostTagsRepository } from "./postTags.repository.interface";
import { PostTag } from "../../models";

export class PostsTagsRepository implements IPostTagsRepository {
	public getPostTagsByPostId(postId: string): Promise<PostTag[]> {
		throw new Error("Method not implemented.");
	}
}