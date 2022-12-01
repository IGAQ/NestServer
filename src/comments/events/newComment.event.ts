export class NewCommentEvent {
    subscriberId: UUID;

    username: string;

    avatar: string;

    commentContent: string;

    postTypeName?: string;

    constructor(partial?: Partial<NewCommentEvent>) {
        Object.assign(this, partial);
    }
}
