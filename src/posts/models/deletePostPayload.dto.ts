import { ApiProperty } from "@nestjs/swagger";

export class DeletePostPayloadDto {
    @ApiProperty({ type: String })
    postId: string;

    constructor(partial?: Partial<DeletePostPayloadDto>) {
        Object.assign(this, partial);
    }
}
