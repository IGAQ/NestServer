import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateBioDto {
    @ApiProperty({ type: String })
    @IsString()
    bio: string;

    constructor(partial?: Partial<UpdateBioDto>) {
        Object.assign(this, partial);
    }
}
