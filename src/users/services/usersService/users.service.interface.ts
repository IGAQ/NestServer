import { UserDto } from "../../models";
import { RegisterUserPayloadDto } from "../../models";

export interface IUsersService {
    findAll(): Promise<any>;

    findUserByUsername(username: string): Promise<UserDto | undefined>;

    findUserById(userId: number): Promise<UserDto | undefined>;

    addUser(user: RegisterUserPayloadDto): Promise<void>;
}
