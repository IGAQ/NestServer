import { ApiProperty } from "@nestjs/swagger";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";

@Labels("PostType")
export class PostType {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    postTypeId: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    postType: string;

    constructor(partial?: Partial<PostType>) {
        Object.assign(this, partial);
    }
}
