import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateGenderDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    genderId: UUID;

    constructor(partial?: Partial<UpdateGenderDto>) {
        Object.assign(this, partial);
    }
}
