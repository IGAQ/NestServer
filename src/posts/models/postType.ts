import { ApiProperty } from "@nestjs/swagger";

export class PostType {
    @ApiProperty({ type: String, format: "uuid" })
    postTypeId: string;

    @ApiProperty({ type: String })
    postType: string;

    constructor(partial?: Partial<PostType>) {
        Object.assign(this, partial);
    }
}
