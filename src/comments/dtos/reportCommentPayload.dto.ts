import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsString } from "class-validator";

export class ReportCommentPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    commentId: UUID;

    @ApiProperty({ type: String, minLength: 5, maxLength: 500 })
    @IsString()
    reason: string;

    constructor(partial?: Partial<ReportCommentPayloadDto>) {
        Object.assign(this, partial);
    }
}
