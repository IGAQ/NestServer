import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class SignInPayloadDto {
	@IsString()
	@IsNotEmpty()
	username: string;

	// @IsEmail()
	// @IsNotEmpty()
	// email: string;

	@IsString()
	@IsNotEmpty()
	password: string;
}