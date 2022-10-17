import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Role } from "./role";
import { Sexuality } from "./sexuality";
import { Gender } from "./gender";
import { Openness } from "./openness";
import { Post } from "../../posts/models";
import { Model, RichRelatedEntities } from "../../neo4j/neo4j.helper.types";
import { AuthoredProps, UserToPostRelTypes } from "./toPost";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { UserToSexualityRelTypes } from "./toSexuality";
import { UserToGenderRelTypes } from "./toGender";
import { UserToOpennessRelTypes } from "./toOpenness";

export type AvatarUrl = string;
export type AvatarAscii = string;

@Labels("User")
export class User extends Model {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    userId: string;

    @ApiProperty({ type: Date })
    @NodeProperty()
    createdAt: number;
    @ApiProperty({ type: Date })
    @NodeProperty()
    updatedAt: number;

    @ApiProperty({ type: String })
    @NodeProperty()
    avatar: AvatarAscii | AvatarUrl;

    @ApiProperty({ type: String })
    @NodeProperty()
    email: string;
    @ApiProperty({ type: Boolean })
    @NodeProperty()
    emailVerified: boolean;

    @ApiProperty({ type: String })
    @NodeProperty()
    phoneNumber: Nullable<string>;
    @ApiProperty({ type: Boolean })
    @NodeProperty()
    phoneNumberVerified: boolean;

    @ApiProperty({ type: String })
    @NodeProperty()
    username: string;
    @ApiProperty({ type: String })
    @NodeProperty()
    normalizedUsername: string;

    @ApiProperty({ type: String })
    @NodeProperty()
    @Exclude()
    passwordHash: string;

    @ApiProperty({ type: Number })
    @NodeProperty()
    level: number;

    @ApiProperty({ type: Role })
    roles: Role[];

    @ApiProperty({ type: Post, isArray: true })
    posts: RichRelatedEntities<Post, UserToPostRelTypes>;

    @ApiProperty({ type: Sexuality })
    sexuality: Nullable<Sexuality>;

    @ApiProperty({ type: Gender })
    gender: Nullable<Gender>;

    @ApiProperty({ type: Openness })
    openness: Nullable<Openness>;

    constructor(partial?: Partial<User>, neo4jService?: Neo4jService) {
        super(neo4jService);
        Object.assign(this, partial);
    }

    public async getAuthoredPosts(): Promise<Post[]> {
        const queryResult = await this.neo4jService.read(
            `
            MATCH (u:User { userId: $userId})-[r:${UserToPostRelTypes.AUTHORED}]-(p:Post)
            RETURN p, r
            `,
            {
                userId: this.userId,
            }
        );
        return queryResult.records.map((record) => {
            let postProps = record.get("p").properties;
            let authoredProps = new AuthoredProps(record.get("r").properties);
            return new Post({
                authorUser: this,
                createdAt: authoredProps.authoredAt,
                ...postProps,
            }, this.neo4jService);
        });
    }

    public async getSexuality(): Promise<Nullable<Sexuality>> {
        const queryResult = await this.neo4jService.read(
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
        this.sexuality = new Sexuality(queryResult.records[0].get("s").properties);
        return this.sexuality;
    }

    public async getGender(): Promise<Nullable<Gender>> {
        const queryResult = await this.neo4jService.read(
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
        this.gender = new Gender(queryResult.records[0].get("g").properties);
        return this.gender;
    }

    public async getOpenness(): Promise<Nullable<Openness>> {
        const queryResult = await this.neo4jService.read(
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
        this.openness = new Openness(queryResult.records[0].get("o").properties);
        return this.openness;
    }
}
