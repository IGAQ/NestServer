export class PostGotRestrictedEvent {
    subscriberId: UUID;

    postTitle: string;

    reason: string;

    username: string;

    avatar: string;

    constructor(partial?: Partial<PostGotRestrictedEvent>) {
        Object.assign(this, partial);
    }
}
