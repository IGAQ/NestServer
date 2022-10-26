import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class HasPostTagProps implements RelationshipProps {
    constructor(partial?: Partial<HasPostTagProps>) {
        Object.assign(this, partial);
    }
}
