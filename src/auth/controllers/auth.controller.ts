import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthDto } from "../models";
import { IAuthService } from "../services/auth.service.interface";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    constructor(@Inject("IAuthService") private _authService: IAuthService) { }

    @Post("signup")
    public signup(@Body() dto: AuthDto) {
        return this._authService.signup(dto);
    }

    @Post("signin")
    public signin() {
        return this._authService.signin();
    }
}
