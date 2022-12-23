import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { VoteType } from "../../_domain/models/enums";

export class VotePostPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsNotEmpty()
    @IsUUID()
    postId: UUID;

    @ApiProperty({ enum: VoteType })
    @IsNotEmpty()
    @IsEnum(VoteType)
    voteType: VoteType;

    constructor(partial?: Partial<VotePostPayloadDto>) {
        Object.assign(this, partial);
    }
}
