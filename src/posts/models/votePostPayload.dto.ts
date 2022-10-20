import { ApiProperty } from "@nestjs/swagger";

export enum VoteType {
    UPVOTE = "UPVOTE",
    DOWNVOTE = "DOWNVOTE",
}

export class VotePostPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    postId: string;

    @ApiProperty({ type: VoteType })
    voteType: VoteType;

    constructor(partial?: Partial<VotePostPayloadDto>) {
        Object.assign(this, partial);
    }
}
