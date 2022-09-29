import { Inject, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthDto } from "../models";
import { IAuthService } from "./auth.service.interface";
import { IUsersService } from "../../users/services/usersService/users.service.interface";

@Injectable({})
export class AuthServiceTest implements IAuthService {
    constructor(@Inject("IUsersService") private _usersService: IUsersService) {}

    public async signup(dto: AuthDto) {
        const salt = await bcrypt.genSaltSync(10);
        const hash = await bcrypt.hashSync(dto.password, salt);

        const user = {
            email: dto.email,
            password: hash,
        };
        return user;
    }

    public signin() {
        return { msg: "I am signed in" };
    }
}
