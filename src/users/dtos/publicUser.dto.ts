import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { Gender, Sexuality, User } from "../models";
import { AvatarAscii, AvatarUrl } from "../models/user";

export class PublicUserDto {
    @ApiProperty({ type: String, format: "uuid" })
    @IsNotEmpty()
    userId: UUID;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    avatar: AvatarAscii | AvatarUrl;

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

    constructor(partial?: Partial<PublicUserDto>) {
        Object.assign(this, partial);
    }

    static fromUser(user: User): PublicUserDto {
        return new PublicUserDto({
            userId: user.userId,
            username: user.username,
            avatar: user.avatar || null,
            level: user.level,
            sexuality: user.sexuality || null,
            gender: user.gender || null,
        });
    }
}
