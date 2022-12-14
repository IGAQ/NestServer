import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import {
    Model,
    RelatedEntityRecordItem,
    RichRelatedEntities,
} from "../../neo4j/neo4j.helper.types";
import { User } from "../../users/models";
import { PostType, PostTag, Award } from "./index";
import { _ToSelfRelTypes, RestrictedProps, DeletedProps } from "../../_domain/models/toSelf";
import { HasAwardProps, PostToAwardRelTypes } from "./toAward";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { PostToPostTypeRelTypes } from "./toPostType";
import { PostToPostTagRelTypes } from "./toTags";
import { AuthoredProps, UserToPostRelTypes } from "../../users/models/toPost";
import { Type } from "class-transformer";
import { PublicUserDto } from "../../users/dtos";
import { PostToCommentRelTypes } from "./toComment";
import { Comment } from "../../comments/models";
import neo4j from "neo4j-driver";
import { VoteType } from "../../_domain/models/enums";
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInstance,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator";

@Labels("Post")
export class Post extends Model {
    @NodeProperty()
    @IsUUID()
    postId: UUID;

    @IsInstance(PostType)
    @IsOptional()
    postType: PostType;

    @IsArray()
    @IsOptional()
    postTags: PostTag[] = new Array<PostTag>();

    @IsOptional()
    awards: RichRelatedEntities<Award, PostToAwardRelTypes>;

    @IsNumber()
    createdAt: number;

    @NodeProperty()
    updatedAt: number;

    @NodeProperty()
    @IsString()
    postTitle: string;
    @NodeProperty()
    @IsString()
    postContent: string;

    @IsInstance(User)
    authorUser: User | any;

    @NodeProperty()
    @IsBoolean()
    pending: boolean;

    @IsInstance(RestrictedProps)
    @IsOptional()
    restrictedProps: Nullable<RestrictedProps> = null;

    @IsNumber()
    totalVotes: number;

    @IsNumber()
    @IsOptional()
    totalComments: number | undefined;

    @IsArray({ each: true })
    @Type(() => Comment)
    comments: Comment[];

    @NodeProperty()
    @IsOptional()
    @IsInstance(DeletedProps)
    deletedProps: Nullable<DeletedProps> = null;

    @IsOptional()
    @IsEnum(VoteType)
    userVote: Nullable<VoteType> | undefined = undefined;

    constructor(partial?: Partial<Post>, neo4jService?: Neo4jService) {
        super(neo4jService);
        Object.assign(this, partial);
    }

    public async toJSON(props: ToJSONProps = {}) {
        if (this.neo4jService) {
            await Promise.all([
                ...(!this.postType ? [this.getPostType()] : []),
                ...(this.postTags.length === 0 ? [this.getPostTags()] : []),
                ...(!this.awards ? [this.getAwards()] : []),
                ...(!this.restrictedProps ? [this.getRestricted()] : []),
                ...(!this.deletedProps ? [this.getDeletedProps()] : []),
                ...(!this.createdAt ? [this.getCreatedAt()] : []),
                ...(!this.totalVotes ? [this.getTotalVotes()] : []),
                ...(!this.authorUser ? [this.getAuthorUser()] : []),
                ...(props.authenticatedUserId ? [this.getUserVote(props.authenticatedUserId)] : []),
            ]);
        }

        this.authorUser = PublicUserDto.fromUser(this.authorUser);
        this.neo4jService = undefined;
        return { ...this };
    }

    public async getComments(limit = 0): Promise<Comment[]> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (p:Post {postId: $postId})-[:${PostToCommentRelTypes.HAS_COMMENT}]->(c:Comment)
                RETURN c
                ${limit != 0 ? `LIMIT $limit` : ""}
            `,
            {
                postId: this.postId,
                ...(limit != 0 ? { limit: neo4j.int(limit) } : {}),
            }
        );
        const records = queryResult.records;
        if (records.length === 0) {
            this.comments = [];
            return this.comments;
        }
        const comments = records.map(r => new Comment(r.get("c").properties, this.neo4jService));
        this.comments = comments;
        return comments;
    }

    public async getUserVote(userId): Promise<Nullable<VoteType>> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId })-[r:${UserToPostRelTypes.UPVOTES}|${UserToPostRelTypes.DOWN_VOTES}]->(p:Post { postId: $postId }) 
            RETURN r
            `,
            {
                userId,
                postId: this.postId,
            }
        );

        if (queryResult.records.length > 0) {
            // user has already voted on this post
            const relType = queryResult.records[0].get("r").type as VoteType;
            this.userVote = relType;
            return relType;
        }

        this.userVote = null;
        return null;
    }

    public async getTotalVotes(): Promise<number> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User)-[n:${UserToPostRelTypes.UPVOTES}]->(p:Post { postId: $postId }) 
                RETURN COUNT(n) as totalVotes
            `,
            {
                postId: this.postId,
            }
        );
        const upVotes = queryResult.records[0].get("totalVotes");
        const queryResult2 = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User)-[n:${UserToPostRelTypes.DOWN_VOTES}]->(p:Post { postId: $postId })
                RETURN COUNT(n) as totalVotes
            `,
            {
                postId: this.postId,
            }
        );
        const downVotes = queryResult2.records[0].get("totalVotes");
        this.totalVotes = upVotes - downVotes;
        return this.totalVotes;
    }

    public async getCreatedAt(): Promise<number> {
        if (this.createdAt !== undefined) return this.createdAt;
        await this.getAuthorUser();
        return this.createdAt;
    }

    public async getAuthorUser(): Promise<User> {
        if (this.authorUser !== undefined) return this.authorUser;
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (p:Post {postId: $postId})<-[r:${UserToPostRelTypes.AUTHORED}]-(u:User)
            RETURN u, r
            `,
            {
                postId: this.postId,
            }
        );
        if (queryResult.records.length === 0) {
            this.authorUser = null;
            return null;
        }
        const record = queryResult.records[0];
        const result = new User(record.get("u").properties, this.neo4jService);
        this.authorUser = result;

        this.createdAt = (record.get("r").properties as AuthoredProps).authoredAt;

        return result;
    }

    public async getDeletedProps(): Promise<DeletedProps> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (p:Post {postId: $postId})-[r:${_ToSelfRelTypes.DELETED}]->(p)
            RETURN r
            `,
            {
                postId: this.postId,
            }
        );
        if (queryResult.records.length === 0) return null;
        const result = new DeletedProps(queryResult.records[0].get("r").properties);
        this.deletedProps = result;
        return result;
    }

    public async getRestricted(): Promise<Nullable<RestrictedProps>> {
        const queryResult = await this.neo4jService.tryReadAsync(
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
        const queryResult = await this.neo4jService.tryReadAsync(
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
        if (this.awards === undefined)
            this.awards = {} as RichRelatedEntities<Award, PostToAwardRelTypes>;
        this.awards[PostToAwardRelTypes.HAS_AWARD] = {
            records: result,
            relType: PostToAwardRelTypes.HAS_AWARD,
        };
        return result;
    }

    public async getPostType(): Promise<PostType> {
        const queryResult = await this.neo4jService.tryReadAsync(
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
        const queryResult = await this.neo4jService.tryReadAsync(
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

interface ToJSONProps {
    authenticatedUserId?: string;
}
