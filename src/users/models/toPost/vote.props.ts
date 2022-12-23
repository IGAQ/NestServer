import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsNumber } from "class-validator";

export class VoteProps implements RelationshipProps {
    @IsNumber()
    votedAt: number;

    constructor(partial?: Partial<VoteProps>) {
        Object.assign(this, partial);
    }
}
