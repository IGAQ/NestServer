import { HttpException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { IUsersService } from "../../users/services/users.service.interface";
import { AuthDto, SignInPayloadDto, SignTokenDto } from "../models";
import { IAuthService } from "./auth.service.interface";
import { UserDto } from "../../users/models";

@Injectable({})
export class AuthService implements IAuthService {
    constructor(
        @Inject("IUsersService") private _usersService: IUsersService,
        private _jwtService: JwtService,
        private _configService: ConfigService
    ) { }

    public async signup(dto: AuthDto) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(dto.password, salt);

        try {
            await this._usersService.addUser({
                username: dto.username,
                email: dto.email,
                password: hash,
            });
            return this.signToken(new UserDto(dto));
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

        return this.signToken(user);
    }

    private async signToken(user: UserDto): Promise<SignTokenDto> {
        const payload = {
            sub: user.userId,
            username: user.username,
        };
        // The JWT token is signed with the secret key and the algorithm specified in the environment variables.
        const secret = this._configService.get("JWT_SECRET") || "secret";

        const token = await this._jwtService.signAsync(payload, {
            expiresIn: "15m",
            secret: secret,
        });
        return new SignTokenDto({
            access_token: token,
        });
    }
}
