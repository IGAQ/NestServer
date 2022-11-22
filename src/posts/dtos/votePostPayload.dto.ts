import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

export enum VoteType {
    UPVOTES = "UPVOTES",
    DOWN_VOTES = "DOWN_VOTES",
}

export class VotePostPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsNotEmpty()
    @IsUUID()
    postId: string;

    @ApiProperty({ type: VoteType })
    @IsNotEmpty()
    @IsEnum(VoteType)
    voteType: VoteType;

    constructor(partial?: Partial<VotePostPayloadDto>) {
        Object.assign(this, partial);
    }
}
