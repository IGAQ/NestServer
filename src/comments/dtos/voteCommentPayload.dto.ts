import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { VoteType } from "../../_domain/models/enums";

export class VoteCommentPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsNotEmpty()
    @IsUUID()
    commentId: UUID;

    @ApiProperty({ enum: VoteType })
    @IsNotEmpty()
    @IsEnum(VoteType)
    voteType: VoteType;

    constructor(partial?: Partial<VoteCommentPayloadDto>) {
        Object.assign(this, partial);
    }
}
