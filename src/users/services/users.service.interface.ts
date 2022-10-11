import { User } from "../models";
import { RegisterUserPayloadDto } from "../models";

export interface IUsersService {
    findAll(): Promise<User[]>;

    findUserByUsername(username: string): Promise<User | undefined>;

    findUserById(userId: string): Promise<User | undefined>;

    addUser(user: RegisterUserPayloadDto): Promise<void>;

    updateUser(user: User): Promise<void>;
}
