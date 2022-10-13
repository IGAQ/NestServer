import { ApiProperty } from "@nestjs/swagger";
import { Labels } from "../../neo4j/neo4j.decorators";
import { RelatedEntities } from "../../neo4j/neo4j.helper.types";
import { User } from "../../users/models";
import { PostType, PostTag, Award } from "./index";
import { RestrictedProps } from "./toSelf";
import { PostToAwardRelTypes } from "./toAward";

@Labels("Post")
export class Post {
    @ApiProperty({ type: String, format: "uuid" })
    postId: string;

    @ApiProperty({ type: PostType })
    postType: PostType;

    @ApiProperty({ type: PostTag, isArray: true })
    postTags: PostTag[];

    @ApiProperty({ type: Award, isArray: true })
    awards: RelatedEntities<Award, PostToAwardRelTypes>;

    @ApiProperty({ type: Number })
    updatedAt: number;

    @ApiProperty({ type: String })
    postTitle: string;
    @ApiProperty({ type: String })
    postContent: string;

    @ApiProperty({ type: String })
    authorUser: User;

    @ApiProperty({ type: Boolean })
    pending: boolean;

    @ApiProperty({ type: RestrictedProps })
    restrictedProps?: RestrictedProps = null;

    constructor(partial?: Partial<Post>) {
        Object.assign(this, partial);
    }
}
