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
            password: "john123",
        },
        {
            userId: 2,
            username: "chris",
            password: "secret",
        },
        {
            userId: 3,
            username: "maria",
            password: "guess",
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

        this._users.push(newUser);
    }
}
