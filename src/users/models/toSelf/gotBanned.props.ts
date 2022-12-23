import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

export class GotBannedProps implements RelationshipProps {
    @IsNumber()
    bannedAt: number;

    @IsUUID()
    moderatorId: UUID;

    @IsString()
    @IsNotEmpty()
    reason: string;

    constructor(partial?: Partial<GotBannedProps>) {
        Object.assign(this, partial);
    }
}
