import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class ModerationPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    id: string;

    @ApiProperty({ type: String })
    @IsUUID()
    moderatorId: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    reason: string;

    constructor(partial?: Partial<ModerationPayloadDto>) {
        Object.assign(this, partial);
    }
}
