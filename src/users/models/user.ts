import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Role } from "./role";
import { Post } from "../../posts/models";
import { RelatedEntities } from "../../neo4j/neo4j.helper.types";
import { UserToPostRelTypes } from "./toPost";
import { Labels } from "../../neo4j/neo4j.decorators";

@Labels("User")
export class User {
    @ApiProperty({ type: String, format: "uuid" })
    userId: string;

    @ApiProperty({ type: Date })
    createdAt: number;
    @ApiProperty({ type: Date })
    updatedAt: number;

    @ApiProperty({ type: String })
    email: string;
    @ApiProperty({ type: Boolean })
    emailVerified: boolean;

    @ApiProperty({ type: String })
    phoneNumber: string;
    @ApiProperty({ type: Boolean })
    phoneNumberVerified: boolean;

    @ApiProperty({ type: String })
    username: string;
    @ApiProperty({ type: String })
    normalizedUsername: string;

    @ApiProperty({ type: String })
    @Exclude()
    passwordHash: string;

    @ApiProperty({ type: Number })
    level: number;

    @ApiProperty({ type: Role })
    role: Role[];

    @ApiProperty({ type: Post, isArray: true })
    posts: RelatedEntities<Post, UserToPostRelTypes>;

    constructor(partial?: Partial<User>) {
        Object.assign(this, partial);
    }
}
