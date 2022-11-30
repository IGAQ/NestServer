import { ApiProperty } from "@nestjs/swagger";

export class ReportCommentPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    commentId: UUID;

    @ApiProperty({ type: String, minLength: 5, maxLength: 500 })
    reason: string;

    constructor(partial?: Partial<ReportCommentPayloadDto>) {
        Object.assign(this, partial);
    }
}
