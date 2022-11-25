import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsNumber, IsString, IsUUID } from "class-validator";

export class ReportedProps implements RelationshipProps {
    @IsUUID()
    moderatorId: string;

    @IsNumber()
    reportedAt: number;

    @IsString()
    reason: string;

    constructor(partial?: Partial<ReportedProps>) {
        Object.assign(this, partial);
    }
}
