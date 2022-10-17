import { ApiProperty } from "@nestjs/swagger";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { Model, RelatedEntityRecordItem, RichRelatedEntities } from "../../neo4j/neo4j.helper.types";
import { User } from "../../users/models";
import { PostType, PostTag, Award } from "./index";
import { _ToSelfRelTypes, RestrictedProps } from "../../common/models/toSelf";
import { HasAwardProps, PostToAwardRelTypes } from "./toAward";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { PostToPostTypeRelTypes } from "./toPostType";
import { PostToPostTagRelTypes } from "./toTags";
import { AuthoredProps, UserToPostRelTypes } from "../../users/models/toPost";

@Labels("Post")
export class Post extends Model {
    @ApiProperty({ type: String, format: "uuid" })
    @NodeProperty()
    postId: string;

    @ApiProperty({ type: PostType })
    postType: PostType;

    @ApiProperty({ type: PostTag, isArray: true })
    postTags: PostTag[] = new Array<PostTag>();

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
    restrictedProps: Nullable<RestrictedProps>;

    constructor(partial?: Partial<Post>, neo4jService?: Neo4jService) {
        super(neo4jService);
        Object.assign(this, partial);
    }

    public async getCreatedAt(): Promise<number> {
        await this.getAuthorUser();
        return this.createdAt;
    }

    public async getAuthorUser(): Promise<User> {
        const queryResult = await this.neo4jService.read(
            `
            MATCH (p:Post {postId: $postId})<-[r:${UserToPostRelTypes.AUTHORED}]-(u:User)
            RETURN u, r
            `,
            {
                postId: this.postId,
            }
        );
        if (queryResult.records.length === 0) throw new Error("Post has no author");
        const record = queryResult.records[0];
        const result = new User(record.get("u").properties);
        this.authorUser = result;

        this.createdAt = (record.get("r").properties as AuthoredProps).authoredAt;

        return result;
    }

    public async getRestricted(): Promise<Nullable<RestrictedProps>> {
        const queryResult = await this.neo4jService.read(
            `
            MATCH (p:Post {postId: $postId})-[r:${_ToSelfRelTypes.RESTRICTED}]->(p)
            RETURN r
            `,
            {
                postId: this.postId,
            }
        );
        if (queryResult.records.length === 0) return null;
        const result = new RestrictedProps(queryResult.records[0].get("r").properties);
        this.restrictedProps = result;
        return result;
    }

    public async getAwards(): Promise<Array<RelatedEntityRecordItem<Award, HasAwardProps>>> {
        const queryResult = await this.neo4jService.read(
            `
            MATCH (p:Post {postId: $postId})-[r:${PostToAwardRelTypes.HAS_AWARD}]->(a:Award)
            RETURN a, r
            `,
            {
                postId: this.postId,
            }
        );
        const result = queryResult.records.map(record => {
            const entity = new Award(record.get("a").properties);
            const relProps = record.get("r").properties;
            return { entity, relProps };
        });
        if (this.awards === undefined) this.awards = {} as RichRelatedEntities<Award, PostToAwardRelTypes>;
        this.awards[PostToAwardRelTypes.HAS_AWARD] = {
            records: result,
            relType: PostToAwardRelTypes.HAS_AWARD,
        };
        return result;
    }

    public async getPostType(): Promise<PostType> {
        const queryResult = await this.neo4jService.read(
            `
            MATCH (p:Post {postId: $postId})-[r:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(pt:PostType)
            RETURN pt
            `,
            {
                postId: this.postId,
            }
        );
        if (queryResult.records.length === 0) return null;
        const result = new PostType(queryResult.records[0].get("pt").properties);
        this.postType = result;
        return result;
    }

    public async getPostTags(): Promise<PostTag[]> {
        const queryResult = await this.neo4jService.read(
            `
            MATCH (p:Post {postId: $postId})-[r:${PostToPostTagRelTypes.HAS_POST_TAG}]->(pt:PostTag)
            RETURN pt
            `,
            {
                postId: this.postId,
            }
        );
        const result = queryResult.records.map(record => {
            return new PostTag(record.get("pt").properties);
        });
        this.postTags = result;
        return result;
    }
}
