import { SignInPayloadDto, SignTokenDto, SignUpPayloadDto, ChangePasswordAdminDto } from "../dtos";

export interface IAuthService {
    signup(signUpPayloadDto: SignUpPayloadDto): Promise<SignTokenDto>;

    signIn(signInPayloadDto: SignInPayloadDto): Promise<SignTokenDto>;

    changePasswordAdmin(payload: ChangePasswordAdminDto): Promise<void>;
}
