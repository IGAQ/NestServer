export interface IAuthService {
    signup(): { msg: string };

    signin(): { msg: string };
}
