import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";

export class RepliedProps implements RelationshipProps {
    constructor(partial?: Partial<RepliedProps>) {
        Object.assign(this, partial);
    }
}
