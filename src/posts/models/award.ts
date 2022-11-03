import { ApiProperty } from "@nestjs/swagger";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";

@Labels("Award")
export class Award {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    awardId: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    awardName: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    awardSvg: string;

    constructor(partial?: Partial<Award>) {
        Object.assign(this, partial);
    }
}
