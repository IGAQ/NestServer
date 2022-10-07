import { HttpException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { IUsersService } from "../../users/services/users.service.interface";
import { SignInPayloadDto, SignTokenDto, SignUpPayloadDto } from "../models";
import { IAuthService } from "./auth.service.interface";
import { UserDto } from "../../users/models";

@Injectable({})
export class AuthService implements IAuthService {
    constructor(
        @Inject("IUsersService") private _usersService: IUsersService,
        private _jwtService: JwtService,
        private _configService: ConfigService
    ) { }

    public async signup(signUpPayloadDto: SignUpPayloadDto) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(signUpPayloadDto.password, salt);

        try {
            await this._usersService.addUser({
                username: signUpPayloadDto.username,
                email: signUpPayloadDto.email,
                password: hash,
            });
            const token = await this.signToken(new UserDto(signUpPayloadDto));
            return new SignTokenDto({
                access_token: token,
            });
        } catch (error) {
            throw new Error(error);
        }
    }

    public async signIn(signInPayloadDto: SignInPayloadDto) {
        const user = await this._usersService.findUserByUsername(signInPayloadDto.username);
        if (!user) {
            throw new HttpException("User not found", 404);
        }
        const isMatch = await bcrypt.compare(signInPayloadDto.password, user.password);
        if (!isMatch) {
            throw new HttpException("Incorrect password", 400);
        }

        const token = await this.signToken(user);

        return new SignTokenDto({
            access_token: token,
        });
    }

    private async signToken(user: UserDto): Promise<string> {
        const payload = {
            sub: user.userId,
            username: user.username,
        };
        // The JWT token is signed with the secret key and the algorithm specified in the environment variables.
        const secret = this._configService.get("JWT_SECRET") || "secret";

        return await this._jwtService.signAsync(payload, {
            expiresIn: "15m",
            secret: secret,
        });
    }
}
