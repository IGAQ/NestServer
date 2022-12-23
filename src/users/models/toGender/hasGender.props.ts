import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsBoolean } from "class-validator";

export class HasGenderProps implements RelationshipProps {
    @IsBoolean()
    isPrivate: boolean;

    constructor(partial?: Partial<HasGenderProps>) {
        Object.assign(this, partial);
    }
}
