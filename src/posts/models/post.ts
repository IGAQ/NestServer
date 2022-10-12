import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../users/models";
import { Labels } from "../../neo4j/neo4j.decorators";

@Labels("Post")
export class Post {
    @ApiProperty({ type: Number })
    postId: number;

    @ApiProperty({ type: Number })
    updatedAt: number;

    @ApiProperty({ type: String })
    postTitle: string;
    @ApiProperty({ type: String })
    postContent: string;

    @ApiProperty({ type: String })
    authorUser: User;
    @ApiProperty({ type: Number })
    authorUserId: number;

    @ApiProperty({ type: Boolean })
    restricted: boolean;
    @ApiProperty({ type: Boolean })
    pending: boolean;

    constructor(partial?: Partial<Post>) {
        Object.assign(this, partial);
    }
}
