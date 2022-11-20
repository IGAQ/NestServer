import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class AuthoredProps implements RelationshipProps {
    @ApiProperty({ type: Number })
    authoredAt: number;

    @ApiProperty({ type: Boolean })
    anonymously: boolean;

    constructor(partial?: Partial<AuthoredProps>) {
        Object.assign(this, partial);
    }
}
