import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { IUsersService } from "../../users/services/users.service.interface";
import { AuthDto, SignInPayloadDto, SignTokenDto } from "../models";
import { IAuthService } from "./auth.service.interface";

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
            return this.signToken(dto.userId, dto.email);
        } catch (error) {
            throw new Error(error);
        }
    }

    public async signin(signInPayloadDto: SignInPayloadDto) {
        const user = await this._usersService.findUserByUsername(signInPayloadDto.username);
        if (!user) {
            return { msg: "User not found" };
        }
        const isMatch = await bcrypt.compare(signInPayloadDto.password, user.password);
        if (!isMatch) {
            return { msg: "Incorrect password" };
        }

        return this.signToken(user.userId, user.email);
    }

    async signToken(userId: number, email: string): Promise<SignTokenDto> {
        const payload = {
            sub: userId,
            email,
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
