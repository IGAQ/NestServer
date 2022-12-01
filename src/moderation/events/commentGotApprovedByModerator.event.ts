export class CommentGotApprovedByModeratorEvent {
    subscriberId: UUID;

    commentId: UUID;

    username: string;

    avatar: string;

    constructor(partial?: Partial<CommentGotApprovedByModeratorEvent>) {
        Object.assign(this, partial);
    }
}
