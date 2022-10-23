import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { ApiProperty } from "@nestjs/swagger";

export class HasPostTypeProps implements RelationshipProps {
    @ApiProperty({ type: String, format: "uuid" })
    postTypeId: string;

    @ApiProperty({ type: String })
    postType: string;

    constructor(partial?: Partial<HasPostTypeProps>) {
        Object.assign(this, partial);
    }
}
