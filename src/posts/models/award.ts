import { ApiProperty } from "@nestjs/swagger";
import { Labels } from "../../neo4j/neo4j.decorators";

@Labels("Award")
export class Award {
    @ApiProperty({ type: String, format: "uuid" })
    awardId: string;

    @ApiProperty({ type: String })
    awardName: string;

    @ApiProperty({ type: String })
    awardSvg: string;

    constructor(partial?: Partial<Award>) {
        Object.assign(this, partial);
    }
}
