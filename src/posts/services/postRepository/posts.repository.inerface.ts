import { Post } from "../../models";
import { RestrictedProps } from "../../../common/models/toSelf";

export interface IPostsRepository {
    findAll(): Promise<Post[]>;

    findPostById(postId: string): Promise<Post | undefined>;

    addPost(post: Post): Promise<void>;

    restrictPost(postId: string, restrictedProps: RestrictedProps): Promise<void>;
}

