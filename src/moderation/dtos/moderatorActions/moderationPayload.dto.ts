import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { Exclude } from "class-transformer";

export class ModerationPayloadDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    id: UUID;

    @IsUUID()
    @IsOptional()
    @Exclude()
    moderatorId: UUID;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    reason: string;

    constructor(partial?: Partial<ModerationPayloadDto>) {
        Object.assign(this, partial);
    }
}
