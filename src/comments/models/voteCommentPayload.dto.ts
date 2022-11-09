import { ApiProperty } from "@nestjs/swagger";

export enum VoteType {
    UPVOTES = "UPVOTES",
    DOWN_VOTES = "DOWN_VOTES",
}

export class VoteCommentPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    commentId: string;

    @ApiProperty({ type: VoteType })
    voteType: VoteType;

    constructor(partial?: Partial<VoteCommentPayloadDto>) {
        Object.assign(this, partial);
    }
}
