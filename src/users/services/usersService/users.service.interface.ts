import User from "../../models/User";

export interface IUsersService {
    findUserByUsername(username: string): Promise<User | undefined>;
}