import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Exclude } from "class-transformer";

export class AuthDto {
    @IsNumber()
    @IsNotEmpty()
    userId: number;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Exclude()
    password: string;

    constructor(partial?: Partial<AuthDto>) {
        Object.assign(this, partial);
    }
}
