import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { ApiProperty } from "@nestjs/swagger";

@Labels("Gender")
export class Gender {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    genderId: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    genderName: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    genderPronouns: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    genderFlagSvg: string;

    constructor(partial?: Partial<Gender>) {
        Object.assign(this, partial);
    }
}
