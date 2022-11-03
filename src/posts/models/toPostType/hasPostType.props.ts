import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class HasPostTypeProps implements RelationshipProps {
    constructor(partial?: Partial<HasPostTypeProps>) {
        Object.assign(this, partial);
    }
}
