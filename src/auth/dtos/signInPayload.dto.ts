import { IsNotEmpty, IsString } from "class-validator";

export class SignInPayloadDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    constructor(partial?: Partial<SignInPayloadDto>) {
        Object.assign(this, partial);
    }
}
