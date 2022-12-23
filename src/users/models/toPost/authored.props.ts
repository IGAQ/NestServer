import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsBoolean, IsNumber } from "class-validator";

export class AuthoredProps implements RelationshipProps {
    @IsNumber()
    authoredAt: number;

    @IsBoolean()
    anonymously: boolean;

    constructor(partial?: Partial<AuthoredProps>) {
        Object.assign(this, partial);
    }
}
