import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../users/models";

export class Post {
    @ApiProperty({ type: Number })
    postId: number;

    @ApiProperty({ type: Date })
    createdAt: Date;
    @ApiProperty({ type: Date })
    updatedAt: Date;

    @ApiProperty({ type: String })
    title: string;
    @ApiProperty({ type: String })
    content: string;

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
