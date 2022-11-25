import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsBoolean } from "class-validator";

export class HasCommentProps implements RelationshipProps {
    @IsBoolean()
    pinned: boolean;

    constructor(partial?: Partial<HasCommentProps>) {
        Object.assign(this, partial);
    }
}
