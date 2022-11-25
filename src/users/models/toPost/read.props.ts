import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsNumber } from "class-validator";

export class ReadProps implements RelationshipProps {
    @IsNumber()
    readAt: number;

    constructor(partial?: Partial<ReadProps>) {
        Object.assign(this, partial);
    }
}
