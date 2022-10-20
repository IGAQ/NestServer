import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class WasOffendingProps implements RelationshipProps {
	@ApiProperty({ type: Number })
	timestamp: number;

	@ApiProperty({ type: String })
	userContent: string;

	@ApiProperty({ type: Number })
	autoModConfidenceLevel: number;

	constructor(partial?: Partial<WasOffendingProps>) {
		Object.assign(this, partial);
	}
}
