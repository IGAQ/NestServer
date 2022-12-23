export class CommentGotPinnedByAuthorEvent {
    subscriberId: UUID;

    commentId: UUID;

    postId: UUID;

    commentContent: string;

    username: string;

    avatar: string;

    constructor(partial?: Partial<CommentGotPinnedByAuthorEvent>) {
        Object.assign(this, partial);
    }
}
