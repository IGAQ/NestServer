import { Labels } from "../../neo4j/neo4j.decorators";
import { ApiProperty } from "@nestjs/swagger";

@Labels("Gender")
export class Gender {
	@ApiProperty({ type: String, format: "uuid" })
	genderId: string;

	@ApiProperty({ type: String })
	genderName: string;

	@ApiProperty({ type: String })
	genderPronouns: string;

	@ApiProperty({ type: String })
	genderFlagSvg: string;

	constructor(partial?: Partial<Gender>) {
		Object.assign(this, partial);
	}
}