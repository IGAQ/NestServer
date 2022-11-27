import { SignInPayloadDto, SignTokenDto, SignUpPayloadDto } from "../dtos";
import { ChangePasswordAdminDto } from "../dtos/changePasswordAdmin.dto";

export interface IAuthService {
    signup(signUpPayloadDto: SignUpPayloadDto): Promise<SignTokenDto>;

    signIn(signInPayloadDto: SignInPayloadDto): Promise<SignTokenDto>;

    changePasswordAdmin(payload: ChangePasswordAdminDto): Promise<void>;
}
