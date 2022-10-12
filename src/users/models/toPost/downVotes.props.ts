import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class DownVotesProps implements RelationshipProps {
	@ApiProperty({ type: Number })
	downVotedAt: number;

	constructor(partial?: Partial<DownVotesProps>) {
		Object.assign(this, partial);
	}
}