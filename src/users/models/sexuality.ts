import { ApiProperty } from "@nestjs/swagger";
import { Labels } from "../../neo4j/neo4j.decorators";

@Labels("Sexuality")
export class Sexuality {
    @ApiProperty({ type: String, format: "uuid" })
    sexualityId: string;

    @ApiProperty({ type: String })
    sexualityName: string;

    @ApiProperty({ type: String })
    sexualityFlagSvg: string;

    constructor(partial?: Partial<Sexuality>) {
        Object.assign(this, partial);
    }
}
