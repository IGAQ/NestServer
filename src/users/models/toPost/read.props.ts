import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class ReadProps implements RelationshipProps {
    @ApiProperty({ type: Number })
    readAt: number;

    constructor(partial?: Partial<ReadProps>) {
        Object.assign(this, partial);
    }
}
