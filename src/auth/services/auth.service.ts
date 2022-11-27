import { HttpException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { IUsersRepository } from "../../users/repositories/users/users.repository.interface";
import {
    ChangePasswordAdminDto,
    SignInPayloadDto,
    SignTokenDto,
    SignUpPayloadDto,
    JwtTokenPayloadDto,
} from "../dtos";
import { IAuthService } from "./auth.service.interface";
import { User } from "../../users/models";
import { _$ } from "../../_domain/injectableTokens";

@Injectable({})
export class AuthService implements IAuthService {
    constructor(
        @Inject(_$.IUsersRepository) private _usersRepository: IUsersRepository,
        private _jwtService: JwtService,
        private _configService: ConfigService
    ) {}

    public async signup(signUpPayloadDto: SignUpPayloadDto): Promise<SignTokenDto> {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(signUpPayloadDto.password, salt);

        const foundUser = await this._usersRepository.findUserByUsername(signUpPayloadDto.username);
        if (foundUser) {
            throw new HttpException("User already exists", 400);
        }

        const foundUserByEmail = await this._usersRepository.findUserByEmail(
            signUpPayloadDto.email
        );
        if (foundUserByEmail) {
            throw new HttpException("Email already exists", 400);
        }

        try {
            const addedUser = await this._usersRepository.addUser(
                new User({
                    username: signUpPayloadDto.username,
                    email: signUpPayloadDto.email,
                    passwordHash: hash,
                })
            );
            const token = await this.signToken(addedUser);
            return new SignTokenDto({
                access_token: token,
            });
        } catch (error) {
            throw new Error(error);
        }
    }

    public async signIn(signInPayloadDto: SignInPayloadDto): Promise<SignTokenDto> {
        const user = await this._usersRepository.findUserByUsername(signInPayloadDto.username);
        if (!user) {
            throw new HttpException("Authentication failed.", 400);
        }
        const isMatch = await bcrypt.compare(signInPayloadDto.password, user.passwordHash);
        if (!isMatch) {
            throw new HttpException("Authentication failed.", 400);
        }

        const token = await this.signToken(user);

        return new SignTokenDto({
            access_token: token,
        });
    }

    private async signToken(user: User): Promise<string> {
        const payload: JwtTokenPayloadDto = {
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

    public async changePasswordAdmin(payload: ChangePasswordAdminDto): Promise<void> {
        const user = await this._usersRepository.findUserByUsername(payload.username);
        if (!user) {
            throw new HttpException("User not found", 404);
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(payload.newPassword, salt);

        await this._usersRepository.updateUser(user);
    }
}
