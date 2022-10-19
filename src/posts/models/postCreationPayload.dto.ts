import { ApiProperty } from "@nestjs/swagger";

export class PostCreationPayloadDto {
    @ApiProperty({ type: String })
    postTitle: string;

    @ApiProperty({ type: String })
    postContent: string;

    @ApiProperty({ type: String, format: "uuid" })
    postTypeId: string;

    @ApiProperty({ type: String, format: "uuid", isArray: true })
    postTagIds: string[];

    constructor(partial?: Partial<PostCreationPayloadDto>) {
        Object.assign(this, partial);
    }
}