import { AuthDto } from "../dto";

export interface IAuthService {
    signup(dto: AuthDto): Promise<{ email: string }>;

    signin(): { msg: string };
}
