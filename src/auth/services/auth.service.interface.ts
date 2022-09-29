import { AuthDto } from "../models";

export interface IAuthService {
    signup(dto: AuthDto): Promise<{ msg: string }>;

    signin(dto: AuthDto): Promise<{ msg: string }>;
}
