import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Role } from "./role";
import { Sexuality } from "./sexuality";
import { Gender } from "./gender";
import { Post } from "../../posts/models";
import { RichRelatedEntities } from "../../neo4j/neo4j.helper.types";
import { UserToPostRelTypes } from "./toPost";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";

@Labels("User")
export class User {
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

    constructor(partial?: Partial<User>) {
        Object.assign(this, partial);
    }
}
