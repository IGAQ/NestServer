import { AuthDto } from "../models";

export interface IAuthService {
    signup(dto: AuthDto): Promise<object>;

    signIn(dto: AuthDto): Promise<object>;
}
