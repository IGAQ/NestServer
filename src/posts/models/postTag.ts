import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { IsString } from "class-validator";

@Labels("PostTag")
export class PostTag {
    @NodeProperty()
    @IsString()
    tagName: string;

    @NodeProperty()
    @IsString()
    tagColor: string;

    constructor(partial?: Partial<PostTag>) {
        Object.assign(this, partial);
    }
}
