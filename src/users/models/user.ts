import { ApiProperty } from "@nestjs/swagger";
import { Role } from "./role";
import { Post } from "../../posts/models";
import { RelatedEntity } from "../../neo4j/neo4j.helper.types";
import { Exclude } from "class-transformer";

export enum PostAndUserRelationshipTypes {
    AUTHORED = "AUTHORED",
    FAVORITES = "FAVORITES",
    VOTES = "VOTES",
    READ_STATE = "READ_STATE",
}

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
    posts: RelatedEntity<PostAndUserRelationshipTypes, Post>;

    constructor(partial?: Partial<User>) {
        Object.assign(this, partial);
    }
}
