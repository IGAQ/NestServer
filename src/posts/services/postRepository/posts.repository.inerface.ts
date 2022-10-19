import { Post } from "../../models";
import { RestrictedProps } from "../../../_domain/models/toSelf";

export interface IPostsRepository {
    findAll(): Promise<Post[]>;

    findPostById(postId: string): Promise<Post | undefined>;

    addPost(post: Post, anonymous: boolean): Promise<void>;

    deletePost(postId: string): Promise<void>;

    restrictPost(postId: string, restrictedProps: RestrictedProps): Promise<void>;

    unrestrictPost(postId: string): Promise<void>;
}
