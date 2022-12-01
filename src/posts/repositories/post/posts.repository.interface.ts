import { Post } from "../../models";
import { DeletedProps, RestrictedProps } from "../../../_domain/models/toSelf";

export interface IPostsRepository {
    findAll(): Promise<Post[]>;

    findPostByPostType(postTypeName: string): Promise<Post[]>;

    findPostById(postId: string): Promise<Post | undefined>;

    getPostHistoryByUserId(userId: UUID): Promise<Post[]>;

    addPost(post: Post, anonymous: boolean): Promise<Post>;

    updatePost(post: Post): Promise<void>;

    deletePost(postId: string): Promise<void>;

    markAsDeleted(postId: string, deletedProps: DeletedProps): Promise<void>;

    removeDeletedMark(postId: string): Promise<void>;

    restrictPost(postId: string, restrictedProps: RestrictedProps): Promise<void>;

    unrestrictPost(postId: string): Promise<void>;

    getPendingPosts(): Promise<Post[]>;

    getDeletedPosts(): Promise<Post[]>;
}
