import { PostCreationPayloadDto } from "../../dtos";
import { Post } from "../../models";

export interface IPostsService {
    authorNewPost(postPayload: PostCreationPayloadDto): Promise<Post>;

    getQueeryOfTheDay(): Promise<Post>;

    findAllQueeries(): Promise<Post[]>;

    findAllStories(): Promise<Post[]>;

    findPostById(postId: string): Promise<Post>;

    markAsDeleted(postId: string): Promise<void>;
}
