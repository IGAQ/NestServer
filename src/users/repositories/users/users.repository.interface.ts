import { User } from "../../models";

export interface IUsersRepository {
    findAll(): Promise<User[]>;

    findUserByUsername(username: string): Promise<User | undefined>;

    findUserByEmail(email: string): Promise<User | undefined>;

    findUserById(userId: string): Promise<User | undefined>;

    addUser(user: User): Promise<User>;

    updateUser(user: User): Promise<void>;

    deleteUser(userId: string): Promise<void>;
}