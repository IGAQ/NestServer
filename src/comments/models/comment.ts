import { ApiProperty } from "@nestjs/swagger";
import { RestrictedProps } from "../../_domain/models/toSelf";
import { User } from "../../users/models";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { Model } from "../../neo4j/neo4j.helper.types";
import { Neo4jService } from "../../neo4j/services/neo4j.service";

@Labels("Comment")
export class Comment extends Model {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    commentId: string;

    /**
     * The time the comment was created. Its value will be derived from the relationship
     * properties of (u:User)-[authored:AUTHORED]->(c:Comment) RETURN c, authored
     * where authored.createdAt is the value of this property.
     */
    @ApiProperty({ type: Number })
    createdAt: number;

    @ApiProperty({ type: String })
    @NodeProperty()
    commentContent: string;

    @ApiProperty({ type: String, format: "uuid" })
    parentId: Nullable<string>;
    @ApiProperty({ type: Boolean })
    pinned: boolean;

    @ApiProperty({ type: String })
    @NodeProperty()
    updatedAt: number;

    @ApiProperty({ type: User })
    authorUser: User;

    @ApiProperty({ type: Boolean })
    @NodeProperty()
    pending: boolean;

    @ApiProperty({ type: RestrictedProps })
    restrictedProps: Nullable<RestrictedProps> = null;

    @ApiProperty({ type: Comment })
    childComments: Comment[];

    constructor(partial?: Partial<Comment>, neo4jService?: Neo4jService) {
        super(neo4jService);
        Object.assign(this, partial);
    }
}
