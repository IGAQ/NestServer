import { Body, Controller, Inject, Post, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthDto } from "../models";
import { IAuthService } from "../services/auth.service.interface";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    constructor(@Inject("IAuthService") private _authService: IAuthService) {}

    @Post("signup")
    public signup(@Body() dto: AuthDto) {
        return this._authService.signup(dto);
    }

    @Post("signin")
    public signin(@Body() dto: AuthDto) {
        return this._authService.signIn(dto);
    }

    @Post("authenticate")
    // @UseGuards(AuthGuard("jwt"))
    /**
     * This route is for the front-end to use to check whether the user is authenticated or not.
     * In other words, checks if the JWT token is still valid or not.
     * If the AuthGuard PASSES the request, that means the user is authenticated. Therefore, the controller will send a
     * 200 status.
     */
    public authenticate(@Res() response: Response) {
        return response.sendStatus(200);
    }
}
