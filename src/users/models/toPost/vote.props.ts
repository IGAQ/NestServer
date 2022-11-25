import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsUUID } from "class-validator";

export class VoteProps implements RelationshipProps {
    @IsUUID()
    votedAt: number;

    constructor(partial?: Partial<VoteProps>) {
        Object.assign(this, partial);
    }
}
