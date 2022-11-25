import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class DeletePostPayloadDto {
    @ApiProperty({ type: String })
    @IsUUID()
    postId: string;

    constructor(partial?: Partial<DeletePostPayloadDto>) {
        Object.assign(this, partial);
    }
}
