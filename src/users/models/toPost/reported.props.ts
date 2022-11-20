import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { User } from "../user";

export class ReportedProps implements RelationshipProps {
    reportedBy: User;

    reportedAt: number;

    reason: string;

    constructor(partial?: Partial<ReportedProps>) {
        Object.assign(this, partial);
    }
}
