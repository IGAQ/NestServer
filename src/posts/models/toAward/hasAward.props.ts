import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { ApiProperty } from "@nestjs/swagger";

export class HasAwardProps implements RelationshipProps {
	@ApiProperty({ type: String, format: "uuid" })
	awardId: string;

	@ApiProperty({ type: String })
	awardName: string;

	@ApiProperty({ type: String })
	awardSvg: string;

	constructor(partial?: Partial<HasAwardProps>) {
		Object.assign(this, partial);
	}
}