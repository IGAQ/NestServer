import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsNumber, IsString } from "class-validator";

export class WasOffendingProps implements RelationshipProps {
    @IsNumber()
    timestamp: number;

    @IsString()
    userContent: string;

    @IsNumber()
    autoModConfidenceLevel: number;

    constructor(partial?: Partial<WasOffendingProps>) {
        Object.assign(this, partial);
    }
}
