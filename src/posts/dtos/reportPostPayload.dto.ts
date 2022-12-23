import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsString } from "class-validator";

export class ReportPostPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    postId: UUID;

    @ApiProperty({ type: String, minLength: 5, maxLength: 500 })
    @IsString()
    reason: string;

    constructor(partial?: Partial<ReportPostPayloadDto>) {
        Object.assign(this, partial);
    }
}
