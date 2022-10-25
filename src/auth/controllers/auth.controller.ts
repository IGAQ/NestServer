import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SignInPayloadDto, SignUpPayloadDto } from "../models";
import { IAuthService } from "../services/auth.service.interface";
import { AuthGuard } from "@nestjs/passport";
import { _$ } from "../../_domain/injectableTokens";
import { AuthedUser } from "../decorators/authedUser.param.decorator";
import { User } from "../../users/models";

@ApiTags("authentication")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
    constructor(@Inject(_$.IAuthService) private _authService: IAuthService) {}

    @Post("signup")
    public signup(@Body() signUpPayloadDto: SignUpPayloadDto) {
        return this._authService.signup(signUpPayloadDto);
    }

    @Post("signin")
    public signin(@Body() signInPayloadDto: SignInPayloadDto) {
        return this._authService.signIn(signInPayloadDto);
    }

    @Post("authenticate")
    @UseGuards(AuthGuard("jwt"))
    public async authenticate(@AuthedUser() user: User) {
        return await user.toJSON();
    }
}
