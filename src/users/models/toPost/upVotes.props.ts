import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class UpVotesProps implements RelationshipProps {
    @ApiProperty({ type: Number })
    upVotedAt: number;

    constructor(partial?: Partial<UpVotesProps>) {
        Object.assign(this, partial);
    }
}
