import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { IsString } from "class-validator";

@Labels("PostType")
export class PostType {
    @NodeProperty()
    @IsString()
    postTypeName: string;

    constructor(partial?: Partial<PostType>) {
        Object.assign(this, partial);
    }
}
