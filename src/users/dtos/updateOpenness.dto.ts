import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateOpennessDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    opennessId: UUID;

    constructor(partial?: Partial<UpdateOpennessDto>) {
        Object.assign(this, partial);
    }
}
