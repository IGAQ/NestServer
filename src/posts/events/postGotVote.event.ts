export class PostGotVoteEvent {
    subscriberId: UUID;

    postId: UUID;

    username: string;

    avatar: string;

    constructor(partial?: Partial<PostGotVoteEvent>) {
        Object.assign(this, partial);
    }
}
