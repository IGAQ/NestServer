import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { IUsersService } from "../../users/services/users.service.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService, @Inject("IUsersService") private _usersService: IUsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get("JWT_SECRET") || "secret",
        });
    }

    async validate(payload: any) {
        return await this._usersService.findUserById(payload.sub);
    }
}
