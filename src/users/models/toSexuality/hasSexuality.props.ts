import { RelationshipProps } from "../../../neo4j/neo4j.helper.types";
import { IsBoolean } from "class-validator";

export class HasSexualityProps implements RelationshipProps {
    @IsBoolean()
    isPrivate: boolean;

    constructor(partial?: Partial<HasSexualityProps>) {
        Object.assign(this, partial);
    }
}
