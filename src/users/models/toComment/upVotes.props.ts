import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsNumber } from "class-validator";

export class UpVotesProps implements RelationshipProps {
    @IsNumber()
    upVotedAt: number;

    constructor(partial?: Partial<UpVotesProps>) {
        Object.assign(this, partial);
    }
}
