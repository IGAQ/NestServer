import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class DeletePostPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    postId: UUID;

    constructor(partial?: Partial<DeletePostPayloadDto>) {
        Object.assign(this, partial);
    }
}
