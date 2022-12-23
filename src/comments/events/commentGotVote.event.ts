export class CommentGotVoteEvent {
    subscriberId: UUID;

    postId: UUID;

    commentId: UUID;

    username: string;

    avatar: string;

    constructor(partial?: Partial<CommentGotVoteEvent>) {
        Object.assign(this, partial);
    }
}
