export class CommentGotRestrictedEvent {
    subscriberUserId: UUID;

    commentContent: string;

    reason: string;

    username: string;

    avatar: string;

    constructor(partial?: Partial<CommentGotRestrictedEvent>) {
        Object.assign(partial);
    }
}
