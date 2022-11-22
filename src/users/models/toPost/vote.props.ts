import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class VoteProps implements RelationshipProps {
    @ApiProperty({ type: Number })
    votedAt: number;

    constructor(partial?: Partial<VoteProps>) {
        Object.assign(this, partial);
    }
}
