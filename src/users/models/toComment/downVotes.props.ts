import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsNumber } from "class-validator";

export class DownVotesProps implements RelationshipProps {
    @IsNumber()
    downVotedAt: number;

    constructor(partial?: Partial<DownVotesProps>) {
        Object.assign(this, partial);
    }
}
