import { ApiProperty } from "@nestjs/swagger";
import { Labels } from "../../neo4j/neo4j.decorators";

@Labels("PostType")
export class PostType {
    @ApiProperty({ type: String, format: "uuid" })
    postTypeId: string;

    @ApiProperty({ type: String })
    postType: string;

    constructor(partial?: Partial<PostType>) {
        Object.assign(this, partial);
    }
}
