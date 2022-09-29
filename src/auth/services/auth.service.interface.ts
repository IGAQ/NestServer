import { AuthDto } from "../models";

export interface IAuthService {
    signup(dto: AuthDto): Promise<{ email: string }>;

    signin(): { msg: string };
}
