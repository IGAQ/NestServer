import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from "class-validator";

export class SignUpPayloadDto {
    @IsString()
    @IsNotEmpty()
    // @MinLength(3)
    // @MaxLength(12)
    @ApiProperty({ type: String })
    username: string;

    @IsString()
    @IsNotEmpty()
    // @MinLength(4)
    // @MaxLength(20)
    @ApiProperty({ type: String })
    password: string;

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    email: string;

    constructor(partial?: Partial<SignUpPayloadDto>) {
        Object.assign(this, partial);
    }
}
