import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { UserAvatar } from "../models/user";

export class UpdateAvatarDto {
    @ApiProperty({
        type: String,
        description: "Can be an Ascii, an URL pointing to an image, or an SVG.",
    })
    @IsString()
    avatar: UserAvatar;

    constructor(partial?: Partial<UpdateAvatarDto>) {
        Object.assign(this, partial);
    }
}
