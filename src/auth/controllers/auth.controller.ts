import { Controller, Inject, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IAuthService } from "../services/auth.service.interface";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    constructor(@Inject("IAuthService") private _authService: IAuthService) {}

    @Post("signup")
    signup() {
        return this._authService.signup();
    }

    @Post("signin")
    signin() {
        return this._authService.signin();
    }
}
