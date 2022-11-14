import { ApiProperty } from "@nestjs/swagger";

export class ReportPostPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    postId: string;

    @ApiProperty({ type: String, minLength: 5, maxLength: 500 })
    reason: string;

    constructor(partial?: Partial<ReportPostPayloadDto>) {
        Object.assign(this, partial);
    }
}
