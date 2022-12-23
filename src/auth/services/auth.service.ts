import { HttpException, Inject, Injectable, Logger } from "@nestjs/common";
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
    ChangePasswordUserDto,
} from "../dtos";
import { IAuthService } from "./auth.service.interface";
import { User } from "../../users/models";
import { _$ } from "../../_domain/injectableTokens";

@Injectable({})
export class AuthService implements IAuthService {
    private readonly _logger: Logger = new Logger(AuthService.name);

    constructor(
        @Inject(_$.IUsersRepository) private _usersRepository: IUsersRepository,
        private _jwtService: JwtService,
        private _configService: ConfigService
    ) {}

    public async signup(signUpPayloadDto: SignUpPayloadDto): Promise<SignTokenDto> {
        const hash = await this.makePasswordHash(signUpPayloadDto.password);

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
            this._logger.warn(error);
            throw new HttpException("something wrong happened", 500);
        }
    }

    public async signIn(signInPayloadDto: SignInPayloadDto): Promise<SignTokenDto> {
        const user = await this._usersRepository.findUserByUsername(signInPayloadDto.username);
        if (!user) {
            throw new HttpException("Authentication failed.", 400);
        }
        const isMatch = await this.verifyPassword(signInPayloadDto.password, user.passwordHash);
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
            expiresIn: "6h",
            secret: secret,
        });
    }

    public async changePasswordUser(payload: ChangePasswordUserDto): Promise<void> {
        const previousPasswordMatch = await this.verifyPassword(
            payload.previousPassword,
            payload.user.passwordHash
        );
        if (!previousPasswordMatch) {
            throw new HttpException("Previous password is incorrect", 400);
        }

        payload.user.passwordHash = await this.makePasswordHash(payload.newPassword);

        await this._usersRepository.updateUser(payload.user);
    }

    public async changePasswordAdmin(payload: ChangePasswordAdminDto): Promise<void> {
        const user = await this._usersRepository.findUserByUsername(payload.username);
        if (!user) {
            throw new HttpException("User not found", 404);
        }

        user.passwordHash = await this.makePasswordHash(payload.newPassword);

        await this._usersRepository.updateUser(user);
    }

    private async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    private async makePasswordHash(rawPasswor: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(rawPasswor, salt);
    }
}
