import {
    SignInPayloadDto,
    SignTokenDto,
    SignUpPayloadDto,
    ChangePasswordAdminDto,
    ChangePasswordUserDto,
} from "../dtos";

export interface IAuthService {
    signup(signUpPayloadDto: SignUpPayloadDto): Promise<SignTokenDto>;

    signIn(signInPayloadDto: SignInPayloadDto): Promise<SignTokenDto>;

    changePasswordUser(payload: ChangePasswordUserDto): Promise<void>;

    changePasswordAdmin(payload: ChangePasswordAdminDto): Promise<void>;
}
