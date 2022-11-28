import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
    SignInPayloadDto,
    SignTokenDto,
    SignUpPayloadDto,
    ChangePasswordAdminDto,
    ChangePasswordUserDto,
} from "../dtos";
import { IAuthService } from "../services/auth.service.interface";
import { AuthGuard } from "@nestjs/passport";
import { _$ } from "../../_domain/injectableTokens";
import { AuthedUser } from "../decorators/authedUser.param.decorator";
import { Role, User } from "../../users/models";
import { Roles } from "../decorators/roles.decorator";
import { RolesGuard } from "../guards/roles.guard";

@ApiTags("authentication")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
    constructor(@Inject(_$.IAuthService) private _authService: IAuthService) {}

    @Post("signup")
    public signup(@Body() signUpPayloadDto: SignUpPayloadDto): Promise<SignTokenDto> {
        return this._authService.signup(signUpPayloadDto);
    }

    @Post("signin")
    public signin(@Body() signInPayloadDto: SignInPayloadDto): Promise<SignTokenDto> {
        return this._authService.signIn(signInPayloadDto);
    }

    @Post("authenticate")
    @UseGuards(AuthGuard("jwt"))
    public async authenticate(@AuthedUser() user: User) {
        return await user.toJSON();
    }

    @Post("change-password")
    @UseGuards(AuthGuard("jwt"))
    public async changePasswordUser(
        @AuthedUser() user: User,
        @Body() payload: ChangePasswordUserDto
    ): Promise<void> {
        payload.user = user;
        await this._authService.changePasswordUser(payload);
    }

    @Post("change-password-admin")
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async changePasswordAdmin(@Body() payload: ChangePasswordAdminDto): Promise<void> {
        await this._authService.changePasswordAdmin(payload);
    }
}
