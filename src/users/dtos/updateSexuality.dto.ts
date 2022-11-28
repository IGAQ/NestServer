import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateSexualityDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    sexualityId: UUID;

    constructor(partial?: Partial<UpdateSexualityDto>) {
        Object.assign(this, partial);
    }
}
