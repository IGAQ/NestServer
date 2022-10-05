import { Injectable } from "@nestjs/common";
import { RegisterUserPayloadDto, Role, UserDto } from "../models";
import { IUsersService } from "./users.service.interface";

@Injectable()
export class UsersServiceTest implements IUsersService {
    private readonly _users: UserDto[] = [
        {
            userId: 1,
            username: "john",
            password: "$2b$10$BGP81ZvOBntrlEHHw8qxaunw8sfn24DPO4v/WGNZW8QLNA/1MTZG6", // john123
            email: "john@gmail.com",
            roles: [Role.USER],
        },
        {
            userId: 2,
            username: "chris",
            password: "$2b$10$QeRnByFoI7VTlOks5aLMbuVRXnMLyZ8FyuiezNOUIXuvPEc8cXSlu", // secret
            email: "chris@gmail.com",
            roles: [Role.ADMIN],
        },
        {
            userId: 3,
            username: "maria",
            password: "$2b$10$MMks.gHnjpz2Of38.buHC.jhL6BuDoRLaJBYhyvMP6/UGSMx.Fanm", // guess
            email: "maria@gmail.com",
            roles: [Role.USER, Role.MODERATOR],
        },
    ];

    public async findAll(): Promise<any> {
        return this._users;
    }

    public async findUserByUsername(username: string): Promise<UserDto | undefined> {
        return this._users.find(u => u.username === username);
    }

    public async findUserById(userId: number): Promise<UserDto | undefined> {
        return this._users.find(u => u.userId === userId);
    }

    public async addUser(user: RegisterUserPayloadDto): Promise<void> {
        const newUser = new UserDto();
        newUser.userId = this._users.length + 1;
        newUser.username = user.username;
        newUser.password = user.password;
        newUser.email = user.email;

        this._users.push(newUser);
    }
}
