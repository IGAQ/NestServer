import { ApiProperty } from "@nestjs/swagger";
import { Labels } from "../../neo4j/neo4j.decorators";

@Labels("PostTag")
export class PostTag {
    @ApiProperty({ type: String, format: "uuid" })
    tagId: string;

    @ApiProperty({ type: String })
    tagName: string;

    constructor(partial?: Partial<PostTag>) {
        Object.assign(this, partial);
    }
}
