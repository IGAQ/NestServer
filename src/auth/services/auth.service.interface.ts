import { AuthDto } from "../models";

export interface IAuthService {
    signup(dto: AuthDto): Promise<object>;

    signin(dto: AuthDto): Promise<object>;
}
