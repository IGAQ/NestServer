import { Inject, Injectable } from "@nestjs/common";
import { Role, User } from "../../models";
import { IUsersRepository } from "./users.repository.interface";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { UserToSexualityRelTypes, HasSexualityProps } from "../../models/toSexuality";
import { UserToGenderRelTypes, HasGenderProps } from "../../models/toGender";
import { UserToOpennessRelTypes, HasOpennessProps } from "../../models/toOpenness";
import { UserToSelfRelTypes, GotBannedProps } from "../../models/toSelf";

@Injectable()
export class UsersRepository implements IUsersRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<User[]> {
        const queryResult = await this._neo4jService.tryReadAsync(`MATCH (u:User) RETURN u`, {});
        return queryResult.records.map(record => {
            const props = record.get("u").properties;
            props.roles = props.roles.map(r => r?.low ?? r) as Role[];
            return new User(props, this._neo4jService);
        });
    }

    public async findUserByUsername(username: string): Promise<User | undefined> {
        const queryResult = await this._neo4jService.tryReadAsync(
            `MATCH (u:User { normalizedUsername: $normalizedUsername }) RETURN u`,
            { normalizedUsername: username.toUpperCase() }
        );
        if (queryResult.records.length === 0) return undefined;
        const props = queryResult.records[0].get("u").properties;
        props.roles = props.roles.map(r => r?.low ?? r) as Role[];
        return new User(props, this._neo4jService);
    }

    public async findUserByEmail(email: string): Promise<User | undefined> {
        const queryResult = await this._neo4jService.tryReadAsync(
            `MATCH (u:User { email: $email }) RETURN u`,
            { email: email }
        );
        if (queryResult.records.length === 0) return undefined;
        const props = queryResult.records[0].get("u").properties;
        props.roles = props.roles.map(r => r?.low ?? r) as Role[];
        return new User(props, this._neo4jService);
    }

    public async findUserById(userId: UUID): Promise<User | undefined> {
        const queryResult = await this._neo4jService.read(
            `MATCH (u:User {userId: $userId}) RETURN u`,
            {
                userId: userId,
            }
        );
        if (queryResult.records.length === 0) return undefined;
        const props = queryResult.records[0].get("u").properties;
        return new User(
            {
                roles: props.roles.map(r => r.low) as Role[],
                ...props,
            },
            this._neo4jService
        );
    }

    public async addUser(user: User): Promise<User> {
        const userId = this._neo4jService.generateId();
        await this._neo4jService.tryWriteAsync(
            `
                    CREATE (u:User { 
                        userId: $userId,
                        
                        createdAt: $createdAt,
                        updatedAt: $updatedAt,
                        
                        username: $username,
                        normalizedUsername: $normalizedUsername,
                        
                        passwordHash: $passwordHash,
                        
                        phoneNumber: $phoneNumber,
                        phoneNumberVerified: $phoneNumberVerified,
                        
                        email: $email,
                        emailVerified: $emailVerified,
                        
                        level: $level,
                        
                        roles: $roles
                    })`,
            {
                userId: user.userId ?? userId,
                createdAt: user.createdAt ?? new Date().getTime(),
                updatedAt: user.updatedAt ?? new Date().getTime(),
                username: user.username,
                normalizedUsername: user.username.toUpperCase(),
                passwordHash: user.passwordHash,
                phoneNumber: user.phoneNumber ?? "",
                phoneNumberVerified: user.phoneNumberVerified ?? false,
                email: user.email ?? "",
                emailVerified: user.emailVerified ?? false,
                level: user.level ?? 0,
                roles: user.roles ?? [Role.USER],
            } as User
        );

        const addedUser = await this.findUserById(user.userId ?? userId);

        if (user.sexuality) {
            await this._neo4jService.tryWriteAsync(
                `
                    MATCH (u:User {userId: $userId}), (s:Sexuality {sexualityId: $sexualityId)
                    MERGE (u)-[:${UserToSexualityRelTypes.HAS_SEXUALITY}]->(s)`,
                {
                    userId: user.userId,
                    sexualityId: user.sexuality.sexualityId,
                }
            );
            addedUser.sexuality = user.sexuality;
        }

        if (user.gender) {
            await this._neo4jService.tryWriteAsync(
                `
                    MATCH (u:User {userId: $userId}), (g:Gender {genderId: $genderId)
                    CREATE (u)-[:${UserToGenderRelTypes.HAS_GENDER}]->(g)`,
                {
                    userId: user.userId,
                    genderId: user.gender.genderId,
                }
            );
            addedUser.gender = user.gender;
        }

        if (user.openness) {
            await this._neo4jService.tryWriteAsync(
                `
                    MATCH (u:User {userId: $userId}), (o:Openness {opennessId: $opennessId)
                    CREATE (u)-[:${UserToOpennessRelTypes.HAS_OPENNESS_LEVEL_OF}]->(o)`,
                {
                    userId: user.userId,
                    opennessId: user.openness.opennessId,
                }
            );
            addedUser.openness = user.openness;
        }

        return addedUser;
    }

    public async updateUser(user: User): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `MATCH (u:User {userId: $userId}) 
		SET 
			u.phoneNumber = $phoneNumber,
			u.phoneNumberVerified = $phoneNumberVerified,
			u.username = $username,
			u.bio = $bio,
			u.avatar = $avatar,
			u.normalizedUsername = $normalizedUsername,
			u.email = $email,
			u.emailVerified = $emailVerified,
			u.passwordHash = $passwordHash,
			u.level = $level,
			u.roles = $roles,
			u.updatedAt = $updatedAt
		`,
            {
                userId: user.userId,
                phoneNumber: user.phoneNumber ?? "",
                phoneNumberVerified: user.phoneNumberVerified,
                username: user.username,
                bio: user.bio ?? "",
                avatar: user.avatar ?? "",
                normalizedUsername: user.username.toUpperCase(),
                email: user.email,
                emailVerified: user.emailVerified,
                passwordHash: user.passwordHash,
                level: user.level,
                roles: user.roles,
                updatedAt: new Date().getTime(),
            } as User
        );
    }

    public async deleteUser(userId: UUID): Promise<void> {
        await this._neo4jService.tryWriteAsync(`MATCH (u:User {userId: $userId}) DETACH DELETE u`, {
            userId: userId,
        });
    }

    public async connectUserWithSexuality(
        userId: UUID,
        sexualityId: UUID,
        hasSexualityProps: HasSexualityProps
    ): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (u:User { userId : $userId }), (s:Sexuality { sexualityId: $sexualityId })
                    MERGE (u)-[:${UserToSexualityRelTypes.HAS_SEXUALITY} {
                        isPrivate: $isPrivate
                    }]->(s)
                    `,
            {
                userId,
                sexualityId,
                isPrivate: hasSexualityProps.isPrivate,
            }
        );
    }
    public async detachUserWithSexuality(userId: UUID): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (u:User { userId: $userId })-[r:${UserToSexualityRelTypes.HAS_SEXUALITY}]->(s:Sexuality)
                    DELETE r
                `,
            {
                userId,
            }
        );
    }
    public async updateRelationshipPropsOfHasSexuality(
        userId: UUID,
        hasSexualityProps: HasSexualityProps
    ): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                    MATCH (u:User { userId: $userId })-[r:${UserToSexualityRelTypes.HAS_SEXUALITY}]->(s:Sexuality)
                        SET r.isPrivate = $isPrivate
                    `,
            {
                userId,
                isPrivate: hasSexualityProps.isPrivate,
            }
        );
    }

    public async connectUserWithGender(
        userId: UUID,
        genderId: UUID,
        hasGenderProps: HasGenderProps
    ): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (u:User { userId : $userId }), (g:Gender { genderId: $genderId })
                    MERGE (u)-[:${UserToGenderRelTypes.HAS_GENDER} {
                        isPrivate: $isPrivate
                    }]->(g)
                    `,
            {
                userId,
                genderId,
                isPrivate: hasGenderProps.isPrivate,
            }
        );
    }
    public async detachUserWithGender(userId: UUID): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (u:User { userId: $userId })-[r:${UserToGenderRelTypes.HAS_GENDER}]->(g:Gender)
                    DELETE r
                `,
            {
                userId,
            }
        );
    }
    public async updateRelationshipPropsOfHasGender(
        userId: UUID,
        hasGenderProps: HasGenderProps
    ): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                    MATCH (u:User { userId: $userId })-[r:${UserToGenderRelTypes.HAS_GENDER}]->(g:Gender)
                        SET r.isPrivate = $isPrivate
                    `,
            {
                userId,
                isPrivate: hasGenderProps.isPrivate,
            }
        );
    }

    public async connectUserWithOpenness(
        userId: UUID,
        opennessId: UUID,
        hasOpennessProps: HasOpennessProps
    ): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (u:User { userId : $userId }), (o:Openness { opennessId: $opennessId })
                    MERGE (u)-[:${UserToOpennessRelTypes.HAS_OPENNESS_LEVEL_OF} {
                        isPrivate: $isPrivate
                    }]->(o)
                    `,
            {
                userId,
                opennessId,
                isPrivate: hasOpennessProps.isPrivate,
            }
        );
    }
    public async detachUserWithOpenness(userId: UUID): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (u:User { userId: $userId })-[r:${UserToOpennessRelTypes.HAS_OPENNESS_LEVEL_OF}]->(o:Openness)
                    DELETE r
                `,
            {
                userId,
            }
        );
    }
    public async updateRelationshipPropsOfHasOpenness(
        userId: UUID,
        hasOpennessProps: HasOpennessProps
    ): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                    MATCH (u:User { userId: $userId })-[r:${UserToOpennessRelTypes.HAS_OPENNESS_LEVEL_OF}]->(o:Openness)
                        SET r.isPrivate = $isPrivate
                    `,
            {
                userId,
                isPrivate: hasOpennessProps.isPrivate,
            }
        );
    }

    public async addPreviouslyBanned(userId: UUID, banProps: GotBannedProps): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `MATCH (u:User {userId: $userId})
            CREATE (u)-[:${UserToSelfRelTypes.PREVIOUSLY_BANNED} {bannedAt: $bannedAt, moderatorId: $moderatorId, reason: $reason}]->(u)
            `,
            {
                userId: userId,
                bannedAt: banProps.bannedAt,
                moderatorId: banProps.moderatorId,
                reason: banProps.reason,
            }
        );
    }
}
