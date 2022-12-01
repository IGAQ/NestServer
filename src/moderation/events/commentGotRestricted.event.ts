export class CommentGotRestrictedEvent {
    subscriberUserId: UUID;

    commentId: UUID;

    reason: string;

    username: string;

    avatar: string;

    constructor(partial?: Partial<CommentGotRestrictedEvent>) {
        Object.assign(partial);
    }
}
