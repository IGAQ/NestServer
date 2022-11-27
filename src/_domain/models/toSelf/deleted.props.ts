import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsNumber, IsString, IsUUID } from "class-validator";

export class DeletedProps implements RelationshipProps {
    @IsNumber()
    deletedAt: number;

    @IsUUID()
    moderatorId: UUID;

    @IsString()
    reason: string;

    constructor(partial?: Partial<DeletedProps>) {
        Object.assign(this, partial);
    }
}
