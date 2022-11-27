import { Exclude } from "class-transformer";
import { Comment } from "../../comments/models";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import {
    Model,
    RelatedEntityRecord,
    RelatedEntityRecordItem,
    RichRelatedEntities,
} from "../../neo4j/neo4j.helper.types";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { Post } from "../../posts/models";
import { Gender } from "./gender";
import { Openness } from "./openness";
import { Role } from "./role";
import { Sexuality } from "./sexuality";
import { AuthoredProps as UserToCommentAuthoredProps, UserToCommentRelTypes } from "./toComment";
import { HasGenderProps, UserToGenderRelTypes } from "./toGender";
import { HasOpennessProps, UserToOpennessRelTypes } from "./toOpenness";
import { AuthoredProps, FavoritesProps, UserToPostRelTypes } from "./toPost";
import { GotBannedProps, UserToSelfRelTypes, WasOffendingProps } from "./toSelf";
import { HasSexualityProps, UserToSexualityRelTypes } from "./toSexuality";
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInstance,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator";

export type AvatarUrl = string;
export type AvatarAscii = string;

@Labels("User")
export class User extends Model {
    @NodeProperty()
    @IsUUID()
    userId: UUID;

    @NodeProperty()
    @IsNumber()
    createdAt: number;
    @NodeProperty()
    @IsNumber()
    updatedAt: number;

    @NodeProperty()
    @IsString()
    avatar: AvatarAscii | AvatarUrl;

    @NodeProperty()
    @IsString()
    bio: string;

    @NodeProperty()
    @IsString()
    email: string;
    @NodeProperty()
    @IsBoolean()
    emailVerified: boolean;

    @NodeProperty()
    @IsString()
    @IsOptional()
    phoneNumber: Nullable<string>;
    @NodeProperty()
    @IsBoolean()
    phoneNumberVerified: boolean;

    @NodeProperty()
    @IsString()
    username: string;
    @NodeProperty()
    @IsString()
    normalizedUsername: string;

    @NodeProperty()
    @IsString()
    @Exclude()
    passwordHash: string;

    @NodeProperty()
    @IsNumber()
    level: number;

    @IsEnum(Role)
    roles: Role[];

    @IsOptional()
    posts: RichRelatedEntities<Post, UserToPostRelTypes>;

    @IsOptional()
    comments: RichRelatedEntities<Comment, UserToPostRelTypes>;

    @IsInstance(Sexuality)
    @IsOptional()
    sexuality: Nullable<Sexuality>;
    @IsBoolean()
    @IsOptional()
    isSexualityPrivate: boolean;

    @IsInstance(Gender)
    @IsOptional()
    gender: Nullable<Gender>;
    @IsBoolean()
    @IsOptional()
    isGenderPrivate: boolean;

    @IsInstance(Openness)
    @IsOptional()
    openness: Nullable<Openness>;
    @IsBoolean()
    @IsOptional()
    isOpennessPrivate: boolean;

    @IsArray()
    @IsOptional()
    wasOffendingRecords: WasOffendingProps[];

    @IsInstance(GotBannedProps)
    @IsOptional()
    gotBannedProps: Nullable<GotBannedProps>;

    constructor(partial?: Partial<User>, neo4jService?: Neo4jService) {
        super(neo4jService);
        Object.assign(this, partial);
    }

    public async toJSON() {
        if (this.neo4jService) {
            await Promise.all([this.getSexuality(), this.getGender(), this.getOpenness()]);
        }

        delete this.passwordHash;
        delete this.neo4jService;
        delete this.wasOffendingRecords;
        return { ...this };
    }

    /**
     * Checks with the database if the user has a GOT_BANNED relationship, and if it has, it will get its properties
     * and assigns it to the instance's .gotBannedProps property.
     * If the user has no GOT_BANNED relationship, it will assign null to the instance's .gotBannedProps property.
     */
    public async getGotBannedProps(): Promise<Nullable<GotBannedProps>> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId})-[r:${UserToSelfRelTypes.GOT_BANNED}]-(u)
            RETURN r
            `,
            {
                userId: this.userId,
            }
        );
        if (queryResult.records.length === 0) {
            this.gotBannedProps = null;
            return null;
        }
        this.gotBannedProps = new GotBannedProps(queryResult.records[0].get("r").properties);
        return this.gotBannedProps;
    }

    public async addWasOffendingRecord(record: WasOffendingProps): Promise<void> {
        await this.neo4jService.tryWriteAsync(
            `
            MATCH (u:User { userId: $userId })
                CREATE (u)-[r:${UserToSelfRelTypes.WAS_OFFENDING}
                   {
                       timestamp: $timestamp,
                       userContent: $userContent,
                       autoModConfidenceLevel: $autoModFromConfidence
                   }
                ]->(u)
            `,
            {
                userId: this.userId,
                timestamp: record.timestamp,
                userContent: record.userContent,
                autoModFromConfidence: record.autoModConfidenceLevel,
            }
        );
    }

    public async getWasOffendingRecords(): Promise<WasOffendingProps[]> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId})-[r:${UserToSelfRelTypes.WAS_OFFENDING}]-(u)
            RETURN r
            `,
            {
                userId: this.userId,
            }
        );
        this.wasOffendingRecords = queryResult.records.map(
            record => new WasOffendingProps(record.get("r").properties)
        );
        return this.wasOffendingRecords;
    }

    public async getAuthoredPosts(): Promise<Post[]> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId})-[r:${UserToPostRelTypes.AUTHORED}]-(p:Post)
            RETURN p, r
            `,
            {
                userId: this.userId,
            }
        );
        return queryResult.records.map(record => {
            const postProps = record.get("p").properties;
            const authoredProps = new AuthoredProps(record.get("r").properties);
            return new Post(
                {
                    authorUser: this,
                    createdAt: authoredProps.authoredAt,
                    ...postProps,
                },
                this.neo4jService
            );
        });
    }

    public async getAuthoredComments(): Promise<Comment[]> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId})-[r:${UserToCommentRelTypes.AUTHORED}]-(c:Comment)
            RETURN c, r
            `,
            {
                userId: this.userId,
            }
        );
        return queryResult.records.map(record => {
            const commentProps = record.get("c").properties;
            const authoredProps = new UserToCommentAuthoredProps(record.get("r").properties);
            return new Comment(
                {
                    authorUser: this,
                    createdAt: authoredProps.authoredAt,
                    ...commentProps,
                },
                this.neo4jService
            );
        });
    }

    public async getSexuality(): Promise<Nullable<Sexuality>> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId})-[r:${UserToSexualityRelTypes.HAS_SEXUALITY}]-(s:Sexuality)
            RETURN s, r
            `,
            {
                userId: this.userId,
            }
        );
        if (queryResult.records.length === 0) {
            return null;
        }
        const hasSexualityProps = new HasSexualityProps(queryResult.records[0].get("r").properties);
        this.sexuality = new Sexuality(queryResult.records[0].get("s").properties);
        this.isSexualityPrivate = hasSexualityProps.isPrivate || false;
        return this.sexuality;
    }

    public async getFavoritePosts(): Promise<
        RelatedEntityRecord<Post, FavoritesProps, UserToPostRelTypes.FAVORITES>
    > {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId})-[r:${UserToPostRelTypes.FAVORITES}]-(p:Post)
            RETURN p, r
            `,
            {
                userId: this.userId,
            }
        );
        if (this.posts === undefined) this.posts = {} as any;
        this.posts[UserToPostRelTypes.FAVORITES] = {
            records: queryResult.records.map(record => {
                const postProps = record.get("p").properties;
                const favoritedProps = new FavoritesProps(record.get("r").properties);
                return new RelatedEntityRecordItem<Post, FavoritesProps>({
                    entity: new Post(
                        {
                            authorUser: this,
                            ...postProps,
                        },
                        this.neo4jService
                    ),
                    relProps: favoritedProps,
                });
            }),
            relType: UserToPostRelTypes.FAVORITES,
        };
        return this.posts[UserToPostRelTypes.FAVORITES] as RelatedEntityRecord<
            Post,
            FavoritesProps,
            UserToPostRelTypes.FAVORITES
        >;
    }

    public async getGender(): Promise<Nullable<Gender>> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId})-[r:${UserToGenderRelTypes.HAS_GENDER}]-(g:Gender)
            RETURN g, r
            `,
            {
                userId: this.userId,
            }
        );
        if (queryResult.records.length === 0) {
            return null;
        }
        const hasGenderProps = new HasGenderProps(queryResult.records[0].get("r").properties);
        this.gender = new Gender(queryResult.records[0].get("g").properties);
        this.isGenderPrivate = hasGenderProps.isPrivate || false;
        return this.gender;
    }

    public async getOpenness(): Promise<Nullable<Openness>> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId})-[r:${UserToOpennessRelTypes.HAS_OPENNESS_LEVEL_OF}]-(o:Openness)
            RETURN o, r
            `,
            {
                userId: this.userId,
            }
        );
        if (queryResult.records.length === 0) {
            return null;
        }
        const hasOpennessProps = new HasOpennessProps(queryResult.records[0].get("r").properties);
        this.openness = new Openness(queryResult.records[0].get("o").properties);
        this.isOpennessPrivate = hasOpennessProps.isPrivate || false;
        return this.openness;
    }
}
