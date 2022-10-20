import { ApiProperty } from "@nestjs/swagger";

export class PostCreationPayloadDto {
    @ApiProperty({ type: String, minLength: 5, maxLength: 200 })
    postTitle: string;

    @ApiProperty({ type: String, minLength: 5, maxLength: 5000 })
    postContent: string;

    @ApiProperty({ type: String, format: "uuid" })
    postTypeId: string;

    @ApiProperty({ type: String, format: "uuid", isArray: true })
    postTagIds: string[];

    @ApiProperty({ type: Boolean })
    anonymous: boolean;

    constructor(partial?: Partial<PostCreationPayloadDto>) {
        Object.assign(this, partial);
    }
}