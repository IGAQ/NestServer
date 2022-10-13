import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../users/models";
import { Labels } from "../../neo4j/neo4j.decorators";
import { RestrictedProps } from "./toSelf";
import { HasPostTypeProps } from "./toPostType";
import { HasPostTagProps } from "./toTags";
import { HasAwardProps } from "./toAward";

@Labels("Post")
export class Post {
    @ApiProperty({ type: Number })
    postId: number;

    @ApiProperty({ type: HasPostTypeProps })
    postType: HasPostTypeProps;

    @ApiProperty({ type: HasPostTagProps, isArray: true })
    postTags: HasPostTagProps[];

    @ApiProperty({ type: HasAwardProps, isArray: true })
    awards: HasAwardProps[];

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
