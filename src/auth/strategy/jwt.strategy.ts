import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { IUsersRepository } from "../../users/repositories/users/users.repository.interface";
import { _$ } from "../../_domain/injectableTokens";
import { JwtTokenPayloadDto } from "../dtos/jwtTokenPayload.dto";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        @Inject(_$.IUsersRepository) private _usersRepository: IUsersRepository
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get("JWT_SECRET") || "secret",
        });
    }

    async validate(payload: JwtTokenPayloadDto) {
        return await this._usersRepository.findUserByUsername(payload.username);
    }
}
