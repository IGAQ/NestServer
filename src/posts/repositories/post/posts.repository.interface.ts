import { Post } from "../../models";
import { DeletedProps, RestrictedProps } from "../../../_domain/models/toSelf";

export interface IPostsRepository {
    findAll(): Promise<Post[]>;

    findPostByPostType(postTypeName: string): Promise<Post[]>;

    findPostById(postId: UUID): Promise<Post | undefined>;

    findPostsByUserId(userId: UUID): Promise<Post[]>;

    getPostHistoryByUserId(userId: UUID): Promise<Post[]>;

    addPost(post: Post, anonymous: boolean): Promise<Post>;

    updatePost(post: Post): Promise<void>;

    deletePost(postId: UUID): Promise<void>;

    markAsDeleted(postId: UUID, deletedProps: DeletedProps): Promise<void>;

    removeDeletedMark(postId: UUID): Promise<void>;

    restrictPost(postId: UUID, restrictedProps: RestrictedProps): Promise<void>;

    unrestrictPost(postId: UUID): Promise<void>;

    getPendingPosts(): Promise<Post[]>;

    getDeletedPosts(): Promise<Post[]>;
}
