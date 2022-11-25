import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { IsNumber, IsString, IsUUID } from "class-validator";

@Labels("Openness")
export class Openness {
    @NodeProperty()
    @IsUUID()
    opennessId: string;

    @NodeProperty()
    @IsNumber()
    opennessLevel: number;

    @NodeProperty()
    @IsString()
    opennessDescription: string;

    constructor(partial?: Partial<Openness>) {
        Object.assign(this, partial);
    }
}
