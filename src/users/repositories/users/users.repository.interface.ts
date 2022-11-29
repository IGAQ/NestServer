import { User } from "../../models";
import { GotBannedProps } from "src/users/models/toSelf";

export interface IUsersRepository {
    findAll(): Promise<User[]>;

    findUserByUsername(username: string): Promise<User | undefined>;

    findUserByEmail(email: string): Promise<User | undefined>;

    findUserById(userId: UUID): Promise<User | undefined>;

    addUser(user: User): Promise<User>;

    updateUser(user: User): Promise<void>;

    deleteUser(userId: UUID): Promise<void>;

    banUser(userId: UUID, banProps: GotBannedProps): Promise<void>;

    unbanUser(userId: UUID): Promise<void>;

    addPreviouslyBanned(userId: UUID, banProps: GotBannedProps): Promise<void>;
}
