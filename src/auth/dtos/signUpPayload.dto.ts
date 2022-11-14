import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from "class-validator";

export class SignUpPayloadDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(12)
    @ApiProperty({
        type: String,
        minLength: 3,
        maxLength: 12,
        description: "The username of the user.",
    })
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    @MaxLength(20)
    @ApiProperty({
        type: String,
        minLength: 4,
        maxLength: 20,
        description: "The password of the user.",
    })
    password: string;

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({
        type: String,
        description: "The email of the user.",
    })
    email: string;

    constructor(partial?: Partial<SignUpPayloadDto>) {
        Object.assign(this, partial);
    }
}
