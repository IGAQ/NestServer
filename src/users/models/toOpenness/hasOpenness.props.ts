import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsBoolean } from "class-validator";

export class HasOpennessProps implements RelationshipProps {
    @IsBoolean()
    isPrivate: boolean;

    constructor(partial?: Partial<HasOpennessProps>) {
        Object.assign(this, partial);
    }
}
