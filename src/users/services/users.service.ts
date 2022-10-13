import { Inject, Injectable } from "@nestjs/common";
import { RegisterUserPayloadDto, Role, User } from "../models";
import { IUsersService } from "./users.service.interface";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class UsersService implements IUsersService {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<User[]> {
        const allUsers = await this._neo4jService.read(`MATCH (u:User) RETURN u`, {});
        console.debug(allUsers);
        return allUsers.records.map(record => {
            const user = record.get("u").properties;
            user.role = user.role.map(r => r.low) as Role[];
            return user;
        });
    }

    public async findUserByUsername(username: string): Promise<User | undefined> {
        const user = await this._neo4jService.read(
            `MATCH (u:User {username: $username}) RETURN u`,
            { username: username }
        );
        if (user.records.length === 0) return undefined;
        const foundUser = user.records[0].get("u").properties;
        foundUser.role = foundUser.role.map(r => r.low) as Role[];
        return foundUser;
    }

    public async findUserById(userId: string): Promise<User | undefined> {
        const user = await this._neo4jService.read(`MATCH (u:User {userId: $userId}) RETURN u`, {
            userId: userId,
        });
        if (user.records.length === 0) return undefined;
        const foundUser = user.records[0].get("u").properties;
        foundUser.role = foundUser.role.map(r => r.low) as Role[];
        return foundUser;
    }

    public async addUser(user: RegisterUserPayloadDto): Promise<void> {
        this._neo4jService.write(
            `CREATE (u:User {
			userId: $userId,
			createdAt: $createdAt,
			updatedAt: $updatedAt,
			email: $email,
			emailVerified: $emailVerified,
			phoneNumber: $phoneNumber,
			phoneNumberVerified: $phoneNumberVerified,
			username: $username,
			normalizedUsername: $normalizedUsername,
			passwordHash: $passwordHash,
			level: $level
		})`,
            {
                userId: uuidv4(),

                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),

                email: user.email,
                emailVerified: false,

                phoneNumber: "",
                phoneNumberVerified: false,

                username: user.username,
                normalizedUsername: user.username.toUpperCase(),

                passwordHash: user.password,

                role: [Role.USER],

                level: 0,
            } as Omit<User, "posts">
        );
    }

    public async updateUser(user: User): Promise<void> {
        this._neo4jService.write(
            `MATCH (u:User {userId: $userId}) 
		SET 
			u.phoneNumber = $phoneNumber,
			u.phoneNumberVerified = $phoneNumberVerified,
			u.username = $username,
			u.normalizedUsername = $normalizedUsername,
			u.email = $email,
			u.emailVerified = $emailVerified,
			u.passwordHash = $passwordHash,
			u.level = $level,
			u.role = $role,
			u.updatedAt = $updatedAt
		`,
            {
                phoneNumber: user.phoneNumber,
                phoneNumberVerified: user.phoneNumberVerified,
                username: user.username,
                normalizedUsername: user.username.toUpperCase(),
                email: user.email,
                emailVerified: user.emailVerified,
                passwordHash: user.passwordHash,
                level: user.level,
                role: user.role,
                updatedAt: new Date().getTime(),
            } as Omit<User, "posts" | "userId" | "createdAt">
        );
    }

    public async deleteUser(userId: string): Promise<void> {
        this._neo4jService.write(`MATCH (u:User {userId: $userId}) DETACH DELETE u`, {
            userId: userId,
        });
    }
}
