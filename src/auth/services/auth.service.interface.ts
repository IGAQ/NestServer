import { SignInPayloadDto, SignTokenDto, SignUpPayloadDto } from "../models";

export interface IAuthService {
    signup(signUpPayloadDto: SignUpPayloadDto): Promise<SignTokenDto>;

    signIn(signInPayloadDto: SignInPayloadDto): Promise<SignTokenDto>;
}
