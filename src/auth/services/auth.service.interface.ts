import { SignInPayloadDto, SignTokenDto, SignUpPayloadDto } from "../dtos";

export interface IAuthService {
    signup(signUpPayloadDto: SignUpPayloadDto): Promise<SignTokenDto>;

    signIn(signInPayloadDto: SignInPayloadDto): Promise<SignTokenDto>;
}
