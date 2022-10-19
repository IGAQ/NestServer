import { PostCreationPayloadDto } from "../models/postCreationPayload.dto";
import { User } from "../../users/models";
import { Post } from "../models";

export interface IPostsService {
    authorNewPost(postPayload: PostCreationPayloadDto, user: User): Promise<Post>
}