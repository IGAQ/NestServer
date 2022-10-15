import { Injectable } from "@nestjs/common";
import { RegisterUserPayloadDto, Role, User } from "../models";
import { IUsersService } from "./users.service.interface";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class UsersServiceTest implements IUsersService {
    private readonly _users: User[] = [
        new User({
            userId: "1",
            username: "john",
            passwordHash: "$2b$10$BGP81ZvOBntrlEHHw8qxaunw8sfn24DPO4v/WGNZW8QLNA/1MTZG6", // john123
            email: "john@gmail.com",
            roles: [Role.USER],
        }),
        new User({
            userId: "2",
            username: "chris",
            passwordHash: "$2b$10$QeRnByFoI7VTlOks5aLMbuVRXnMLyZ8FyuiezNOUIXuvPEc8cXSlu", // secret
            email: "chris@gmail.com",
            roles: [Role.ADMIN],
        }),
        new User({
            userId: "3",
            username: "maria",
            passwordHash: "$2b$10$MMks.gHnjpz2Of38.buHC.jhL6BuDoRLaJBYhyvMP6/UGSMx.Fanm", // guess
            email: "maria@gmail.com",
            roles: [Role.USER, Role.MODERATOR],
        }),
    ];

    public async findAll(): Promise<User[]> {
        return this._users;
    }

    public async findUserByUsername(username: string): Promise<User | undefined> {
        return this._users.find(u => u.username === username) as any;
    }

    public async findUserById(userId: string): Promise<User | undefined> {
        return this._users.find(u => u.userId === userId) as any;
    }

    public async addUser(user: RegisterUserPayloadDto): Promise<void> {
        const newUser = new User({
            userId: uuidv4(),
            username: user.username,
            passwordHash: user.password,
            email: user.email,
            roles: [Role.USER],
        });

        this._users.push(newUser);
    }

    public async updateUser(user: User): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async deleteUser(userId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
