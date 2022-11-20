import { ApiProperty } from "@nestjs/swagger";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";

@Labels("Sexuality")
export class Sexuality {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    sexualityId: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    sexualityName: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    sexualityFlagSvg: string;

    constructor(partial?: Partial<Sexuality>) {
        Object.assign(this, partial);
    }
}
