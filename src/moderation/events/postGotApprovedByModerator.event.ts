export class PostGotApprovedByModeratorEvent {
    subscriberId: UUID;

    postId: UUID;

    username: string;

    avatar: string;

    constructor(partial?: Partial<PostGotApprovedByModeratorEvent>) {
        Object.assign(this, partial);
    }
}
