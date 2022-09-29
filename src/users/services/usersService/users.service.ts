import { Injectable } from "@nestjs/common";
import User from "../../models/user";
import { IUsersService } from "./users.service.interface";
import { RegisterUserPayloadDto } from "../../models";

@Injectable()
export class UsersService implements IUsersService {
    private readonly _users: User[] = [
        {
            userId: 1,
            username: "john",
            password: "$2b$10$BGP81ZvOBntrlEHHw8qxaunw8sfn24DPO4v/WGNZW8QLNA/1MTZG6", // john123
            email: "john@gmail.com",
        },
        {
            userId: 2,
            username: "chris",
            password: "$2b$10$QeRnByFoI7VTlOks5aLMbuVRXnMLyZ8FyuiezNOUIXuvPEc8cXSlu", // secret
            email: "chris@gmail.com",
        },
        {
            userId: 3,
            username: "maria",
            password: "$2b$10$MMks.gHnjpz2Of38.buHC.jhL6BuDoRLaJBYhyvMP6/UGSMx.Fanm", // guess
            email: "maria@gmail.com",
        },
    ];

    public async findUserByUsername(username: string): Promise<User | undefined> {
        return this._users.find(u => u.username === username);
    }

    public async findUserById(userId: number): Promise<User | undefined> {
        return this._users.find(u => u.userId === userId);
    }

    public async addUser(user: RegisterUserPayloadDto): Promise<void> {
        const newUser = new User();
        newUser.userId = this._users.length + 1;
        newUser.username = user.username;
        newUser.password = user.password;
        newUser.email = user.email;

        this._users.push(newUser);
    }
}
