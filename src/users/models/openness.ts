import { ApiProperty } from "@nestjs/swagger";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";

@Labels("Openness")
export class Openness {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    opennessId: string;

    @ApiProperty({ type: Number })
    @NodeProperty()
    opennessLevel: number;

    @ApiProperty({ type: Number })
    @NodeProperty()
    opennessDescription: string;

    constructor(partial?: Partial<Openness>) {
        Object.assign(this, partial);
    }
}
