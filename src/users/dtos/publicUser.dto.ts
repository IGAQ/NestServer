import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { Gender, Openness, Sexuality, User } from "../models";
import { UserAvatar } from "../models/user";

export class PublicUserDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsNotEmpty()
    userId: UUID;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    avatar: UserAvatar;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    bio: string;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    username: string;

    @ApiProperty({ type: Number })
    @IsNotEmpty()
    level: number;

    @ApiProperty({ type: Sexuality })
    @IsNotEmpty()
    sexuality: Nullable<Sexuality>;

    @ApiProperty({ type: Gender })
    @IsNotEmpty()
    gender: Nullable<Gender>;

    @ApiProperty({ type: Openness })
    @IsNotEmpty()
    openness: Nullable<Openness>;

    constructor(partial?: Partial<PublicUserDto>) {
        Object.assign(this, partial);
    }

    static fromUser(user: User): PublicUserDto {
        return new PublicUserDto({
            userId: user.userId,
            username: user.username,
            avatar: user.avatar || null,
            bio: user.bio || null,
            level: user.level,
            sexuality: user.sexuality && !user.isSexualityPrivate ? user.sexuality : null,
            gender: user.gender && !user.isGenderPrivate ? user.gender : null,
            openness: user.openness && !user.isOpennessPrivate ? user.openness : null,
        });
    }
}
