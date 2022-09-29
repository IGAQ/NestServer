import { Inject, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthDto } from "../models";
import { IAuthService } from "./auth.service.interface";
import { IUsersService } from "../../users/services/usersService/users.service.interface";

@Injectable({})
export class AuthServiceTest implements IAuthService {
    constructor(@Inject("IUsersService") private _usersService: IUsersService) {}

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

    public async signin(dto: AuthDto): Promise<{ msg: string }> {
        const user = await this._usersService.findUserByUsername(dto.username);
        if (!user) {
            return { msg: "User not found" };
        }
        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            return { msg: "Incorrect password" };
        }
        return { msg: "I am signed in" };
    }
}
