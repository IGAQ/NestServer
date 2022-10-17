import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Role } from "./role";
import { Sexuality } from "./sexuality";
import { Gender } from "./gender";
import { Openness } from "./openness";
import { Post } from "../../posts/models";
import { Model, RichRelatedEntities } from "../../neo4j/neo4j.helper.types";
import { UserToPostRelTypes } from "./toPost";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { Neo4jService } from "../../neo4j/services/neo4j.service";

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
}
