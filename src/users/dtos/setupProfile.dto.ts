import { IsBoolean, IsString, IsUUID } from "class-validator";
import { UserAvatar } from "../models/user";
import { ApiProperty } from "@nestjs/swagger";

export class SetupProfileDto {
    @ApiProperty({ type: String })
    @IsString()
    bio: string;

    @ApiProperty({ type: String })
    @IsString()
    avatar: UserAvatar;

    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    genderId: UUID;
    @ApiProperty({ type: Boolean })
    @IsBoolean()
    isGenderPrivate: boolean;

    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    sexualityId: UUID;
    @ApiProperty({ type: Boolean })
    @IsBoolean()
    isSexualityOpen: boolean;

    @ApiProperty({ type: String, format: "uuid" })
    @IsUUID()
    opennessId: UUID;
    @ApiProperty({ type: Boolean })
    @IsBoolean()
    isOpennessPrivate: boolean;

    constructor(partial?: Partial<SetupProfileDto>) {
        Object.assign(this, partial);
    }
}
