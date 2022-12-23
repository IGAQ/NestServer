import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { IsString, IsUUID } from "class-validator";

@Labels("Gender")
export class Gender {
    @NodeProperty()
    @IsUUID()
    genderId: UUID;

    @NodeProperty()
    @IsString()
    genderName: string;

    @NodeProperty()
    @IsString()
    genderPronouns: string;

    @NodeProperty()
    @IsString()
    genderFlagSvg: string;

    constructor(partial?: Partial<Gender>) {
        Object.assign(this, partial);
    }
}
