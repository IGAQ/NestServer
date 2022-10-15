import { ApiProperty } from "@nestjs/swagger";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { RichRelatedEntities } from "../../neo4j/neo4j.helper.types";
import { User } from "../../users/models";
import { PostType, PostTag, Award } from "./index";
import { RestrictedProps } from "../../common/models/toSelf";
import { PostToAwardRelTypes } from "./toAward";

@Labels("Post")
export class Post {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    postId: string;

    @ApiProperty({ type: PostType })
    postType: PostType;

    @ApiProperty({ type: PostTag, isArray: true })
    postTags: PostTag[];

    @ApiProperty({ type: Award, isArray: true })
    awards: RichRelatedEntities<Award, PostToAwardRelTypes>;

    @ApiProperty({ type: Number })
    createdAt: number;

    @ApiProperty({ type: Number })
    @NodeProperty()
    updatedAt: number;

    @ApiProperty({ type: String })
    @NodeProperty()
    postTitle: string;
    @ApiProperty({ type: String })
    @NodeProperty()
    postContent: string;

    @ApiProperty({ type: User })
    authorUser: User;

    @ApiProperty({ type: Boolean })
    @NodeProperty()
    pending: boolean;

    @ApiProperty({ type: RestrictedProps })
    restrictedProps: Nullable<RestrictedProps> = null;

    constructor(partial?: Partial<Post>) {
        Object.assign(this, partial);
    }
}
