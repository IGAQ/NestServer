import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsNumber } from "class-validator";

export class FavoritesProps implements RelationshipProps {
    @IsNumber()
    favoritedAt: number;

    constructor(partial?: Partial<FavoritesProps>) {
        Object.assign(this, partial);
    }
}
