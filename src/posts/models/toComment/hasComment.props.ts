import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { ApiProperty } from "@nestjs/swagger";

export class HasCommentProps implements RelationshipProps {
    @ApiProperty({ type: Boolean })
    pinned: boolean;

    constructor(partial?: Partial<HasCommentProps>) {
        Object.assign(this, partial);
    }
}
