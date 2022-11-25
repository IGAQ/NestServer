import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsUUID } from "class-validator";

export class HasAwardProps implements RelationshipProps {
    @IsUUID()
    awardedBy: string;

    constructor(partial?: Partial<HasAwardProps>) {
        Object.assign(this, partial);
    }
}
