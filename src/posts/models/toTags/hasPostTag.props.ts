import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { ApiProperty } from "@nestjs/swagger";

export class HasPostTagProps implements RelationshipProps {
    @ApiProperty({ type: String, format: "uuid" })
    tagId: string;

    @ApiProperty({ type: String })
    tagName: string;

    constructor(partial?: Partial<HasPostTagProps>) {
        Object.assign(this, partial);
    }
}
