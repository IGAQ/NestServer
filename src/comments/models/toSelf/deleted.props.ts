import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class DeletedProps implements RelationshipProps {
    @ApiProperty({ type: Number })
    deletedAt: number;

    @ApiProperty({ type: String })
    deletedByUserId: string;

    constructor(partial?: Partial<DeletedProps>) {
        Object.assign(this, partial);
    }
}