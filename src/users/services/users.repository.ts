import { Inject, Injectable } from "@nestjs/common";
import { Role, User } from "../models";
import { IUsersRepository } from "./users.repository.interface";
import { Neo4jService } from "../../neo4j/services/neo4j.service";

@Injectable()
export class UsersRepository implements IUsersRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<User[]> {
        const queryResult = await this._neo4jService.tryReadAsync(`MATCH (u:User) RETURN u`, {});
        console.debug(queryResult);
        return queryResult.records.map(record => {
            const props = record.get("u").properties;
            return new User({
                roles: props.roles.map(r => r.low) as Role[],
                ...props,
            }, this._neo4jService);
        });
    }

    public async findUserByUsername(username: string): Promise<User | undefined> {
        const queryResult = await this._neo4jService.tryReadAsync(
            `MATCH (u:User { normalizedUsername: $normalizedUsername }) RETURN u`,
            { normalizedUsername: username.toUpperCase() }
        );
        console.log(queryResult, queryResult.records);
        if (queryResult.records.length === 0) return undefined;
        let props = queryResult.records[0].get("u").properties;
        return new User({
            roles: props.roles.map(r => r.low) as Role[],
            ...props,
        }, this._neo4jService);
    }

    public async findUserById(userId: string): Promise<User | undefined> {
        const queryResult = await this._neo4jService.read(`MATCH (u:User {userId: $userId}) RETURN u`, {
            userId: userId,
        });
        if (queryResult.records.length === 0) return undefined;
        let props = queryResult.records[0].get("u").properties;
        return new User({
            roles: props.roles.map(r => r.low) as Role[],
            ...props,
        }, this._neo4jService);
    }

    public async addUser(user: User): Promise<void> {
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
			level: $level,
			roles: $roles
		})`,
            {
                userId: user.userId,

                createdAt: user.createdAt,
                updatedAt: user.updatedAt,

                email: user.email,
                emailVerified: user.emailVerified,

                phoneNumber: user.phoneNumber,
                phoneNumberVerified: user.phoneNumberVerified,

                username: user.username,
                normalizedUsername: user.username.toUpperCase(),

                passwordHash: user.passwordHash,

                roles: user.roles,

                level: user.level,
            } as User
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
                roles: user.roles,
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
