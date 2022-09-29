import User from "../../models/User";

export interface IUsersService {
    findUserByUsername(username: string): Promise<User | undefined>;

    findUserById(userId: number): Promise<User | undefined>;

    addUser(user: User): Promise<void>;
}
