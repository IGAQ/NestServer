import User from "../../models/user";
import { RegisterUserPayloadDto } from "../../models";

export interface IUsersService {
    findUserByUsername(username: string): Promise<User | undefined>;

    findUserById(userId: number): Promise<User | undefined>;

    addUser(user: RegisterUserPayloadDto): Promise<void>;
}
