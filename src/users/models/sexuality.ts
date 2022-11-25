import { ApiProperty } from "@nestjs/swagger";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { IsString, IsUUID } from "class-validator";

@Labels("Sexuality")
export class Sexuality {
    @NodeProperty()
    @IsUUID()
    sexualityId: string;

    @NodeProperty()
    @IsString()
    sexualityName: string;

    @NodeProperty()
    @IsString()
    sexualityFlagSvg: string;

    constructor(partial?: Partial<Sexuality>) {
        Object.assign(this, partial);
    }
}
