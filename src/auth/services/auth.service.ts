import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthDto } from "../models";
import { IAuthService } from "./auth.service.interface";

@Injectable({})
export class AuthService implements IAuthService {
    async signup(dto: AuthDto) {
        const salt = await bcrypt.genSaltSync(10);
        const hash = await bcrypt.hashSync(dto.password, salt);

        const user = {
            email: dto.email,
            password: hash,
        } as AuthDto;

        delete user.password;
        return user;
    }

    signin() {
        return { msg: "I am signed in" };
    }
}
