import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class RestrictedProps implements RelationshipProps {
    @ApiProperty({ type: Number })
    restrictedAt: number;

    @ApiProperty({ type: String })
    moderatorId: string;

    @ApiProperty({ type: String })
    reason: string;

    constructor(partial?: Partial<RestrictedProps>) {
        Object.assign(this, partial);
    }
}
