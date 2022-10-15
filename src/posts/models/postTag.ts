import { ApiProperty } from "@nestjs/swagger";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";

@Labels("PostTag")
export class PostTag {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    tagId: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    tagName: string;

    constructor(partial?: Partial<PostTag>) {
        Object.assign(this, partial);
    }
}
