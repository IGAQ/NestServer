import { Injectable } from "@nestjs/common";
import User from "../../models/User";
import { IUsersService } from "./users.service.interface";

@Injectable()
export class UsersService implements IUsersService {
    private readonly _users: User[] = [
        {
            userId: 1,
            username: "john",
            password: "john123",
        },
    ];

    public async findUserByUsername(
        username: string,
    ): Promise<User | undefined> {
        return this._users.find((u) => u.username === username);
    }
}
