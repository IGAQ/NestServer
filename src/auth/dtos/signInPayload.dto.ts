import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SignInPayloadDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        type: String,
        minLength: 3,
        maxLength: 12,
        description: "The username of the user",
    })
    username: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        type: String,
        minLength: 4,
        maxLength: 20,
        description: "The password of the user",
    })
    password: string;

    constructor(partial?: Partial<SignInPayloadDto>) {
        Object.assign(this, partial);
    }
}
