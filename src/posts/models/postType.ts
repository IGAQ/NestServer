import { ApiProperty } from "@nestjs/swagger";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";

@Labels("PostType")
export class PostType {
    @ApiProperty({ type: String })
    @NodeProperty()
    postTypeName: string;

    constructor(partial?: Partial<PostType>) {
        Object.assign(this, partial);
    }
}
