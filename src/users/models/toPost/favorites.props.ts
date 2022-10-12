import { ApiProperty } from "@nestjs/swagger";
import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class FavoritesProps implements RelationshipProps {
	@ApiProperty({ type: Number })
	favoritedAt: number;

	constructor(partial?: Partial<FavoritesProps>) {
		Object.assign(this, partial);
	}
}