import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class SignUpPayloadDto {
    @IsString()
    @ApiProperty({ type: String })
    username: string;

    @IsString()
    @ApiProperty({ type: String })
    password: string;

    @IsEmail()
    @ApiProperty({ type: String })
    email: string;

    constructor(partial?: Partial<SignUpPayloadDto>) {
        Object.assign(this, partial);
    }
}
