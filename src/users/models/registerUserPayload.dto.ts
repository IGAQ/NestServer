import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterUserPayloadDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    constructor(partial?: Partial<RegisterUserPayloadDto>) {
        Object.assign(this, partial);
    }
}
