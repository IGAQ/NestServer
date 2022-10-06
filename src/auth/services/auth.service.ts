import { Inject, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthDto } from "../models";
import { IAuthService } from "./auth.service.interface";
import { IUsersService } from "../../users/services/users.service.interface";
import { JwtService } from "@nestjs/jwt";

@Injectable({})
export class AuthService implements IAuthService {
    constructor(
        @Inject("IUsersService") private _usersService: IUsersService,
        private jwt: JwtService
    ) {}

    public async signup(dto: AuthDto): Promise<{ msg: string }> {
        const salt = await bcrypt.genSaltSync(10);
        const hash = await bcrypt.hashSync(dto.password, salt);

        try {
            await this._usersService.addUser({
                username: dto.username,
                email: dto.email,
                password: hash,
            });
            return { msg: "I am signed up" };
        } catch (error) {
            throw new Error(error);
        }
    }

    public async signin(dto: AuthDto) {
        const user = await this._usersService.findUserByUsername(dto.username);
        if (!user) {
            return { msg: "User not found" };
        }
        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            return { msg: "Incorrect password" };
        }

        return this.signToken(dto.username, dto.email);
    }

    async signToken(userId: string, email: string): Promise<{ access_token: string }> {
        const payload = {
            sub: userId,
            email,
        };

        // The JWT token is signed with the secret key and the algorithm specified in the environment variables.
        // const secret = this.config.get("JWT_SECRET");

        const token = await this.jwt.signAsync(payload, {
            expiresIn: "15m",
            // secret: secret,
            secret: "costco-poutine",
        });
        return {
            access_token: token,
        };
    }
}
