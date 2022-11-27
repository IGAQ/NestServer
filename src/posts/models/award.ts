import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { IsString, IsUUID } from "class-validator";

@Labels("Award")
export class Award {
    @NodeProperty()
    @IsUUID()
    awardId: UUID;

    @NodeProperty()
    @IsString()
    awardName: string;

    @NodeProperty()
    @IsString()
    awardSvg: string;

    constructor(partial?: Partial<Award>) {
        Object.assign(this, partial);
    }
}
