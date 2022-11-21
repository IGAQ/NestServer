export interface IModeratorActionsService {
    allowPost(postId: string): Promise<void>;
    restrictPost(postId: string): Promise<void>;

    allowComment(commentId: string): Promise<void>;
    restrictComment(commentId: string): Promise<void>;

    deletePost(postId: string): Promise<void>;
    undeletePost(postId: string): Promise<void>;

    deleteComment(commentId: string): Promise<void>;
    undeleteComment(commentId: string): Promise<void>;
}
