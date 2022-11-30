import { Exclude, Type } from "class-transformer";
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
import neo4j from "neo4j-driver";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { Model } from "../../neo4j/neo4j.helper.types";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { PostToCommentRelTypes } from "../../posts/models/toComment";
import { PublicUserDto } from "../../users/dtos";
import { User } from "../../users/models";
import { AuthoredProps, UserToCommentRelTypes } from "../../users/models/toComment";
import { VoteType } from "../../_domain/models/enums";
import { DeletedProps, RestrictedProps, _ToSelfRelTypes } from "../../_domain/models/toSelf";
import { CommentToSelfRelTypes } from "./toSelf";

@Labels("Comment")
export class Comment extends Model {
    @NodeProperty()
    @IsUUID()
    commentId: UUID;

    /**
     * The time the comment was created. Its value will be derived from the relationship
     * properties of (u:User)-[authored:AUTHORED]->(c:Comment) RETURN c, authored
     * where authored.createdAt is the value of this property.
     */
    @IsNumber()
    createdAt: number;

    @NodeProperty()
    @IsString()
    commentContent: string;

    @IsUUID()
    @IsOptional()
    parentId: Nullable<UUID>;

    @IsBoolean()
    pinned: boolean;

    @NodeProperty()
    @IsString()
    updatedAt: number;

    @IsInstance(User)
    authorUser: User | any;

    @NodeProperty()
    @IsBoolean()
    pending: boolean;

    @IsNumber()
    totalVotes: number;

    @IsNumber()
    @IsOptional()
    totalComments: number | undefined;

    @IsInstance(RestrictedProps)
    @IsOptional()
    restrictedProps: Nullable<RestrictedProps> = null;

    @IsArray({ each: true })
    @Type(() => RestrictedProps)
    childComments: Comment[];

    @IsEnum(VoteType)
    @IsOptional()
    userVote: Nullable<VoteType> | undefined = undefined;

    @NodeProperty()
    @Exclude()
    @IsBoolean()
    deletedProps: Nullable<DeletedProps> = null;

    constructor(partial?: Partial<Comment>, neo4jService?: Neo4jService) {
        super(neo4jService);
        Object.assign(this, partial);
    }

    public async toJSON(props: ToJSONProps = {}) {
        if (this.neo4jService) {
            await Promise.all([
                this.getRestricted(),
                this.getDeletedProps(),
                this.getCreatedAt(),
                this.getTotalVotes(),
                this.getAuthorUser(),
                this.getPinStatus(),
                ...(props.authenticatedUserId ? [this.getUserVote(props.authenticatedUserId)] : []),
            ]);
        }

        this.authorUser = PublicUserDto.fromUser(this.authorUser);

        this.neo4jService = undefined;
        return { ...this };
    }

    public async toJSONNested(props: ToJSONProps = {}) {
        if (!this.childComments) {
            return this.toJSON(props);
        }
        for (const i in this.childComments) {
            this.childComments[i] = await this.childComments[i].toJSONNested(props);
        }
        return this.toJSON(props);
    }

    public async getChildrenComments(limit = 0): Promise<Comment[]> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (c:Comment)-[:${
                CommentToSelfRelTypes.REPLIED
            }]->(p:Comment) WHERE c.commentId = $parentId 
            RETURN c
            ${limit > 0 ? `LIMIT $limit` : ""}
            `,
            {
                parentId: this.commentId,
                ...(limit > 0 ? { limit: neo4j.int(limit) } : {}),
            }
        );
        const records = queryResult.records;
        if (records.length === 0) return [];
        this.childComments = records.map(
            record => new Comment(record.get("c").properties, this.neo4jService)
        );
        return this.childComments;
    }

    public async getPinStatus(): Promise<boolean> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (n)-[r:${PostToCommentRelTypes.PINNED_COMMENT}]->(c:Comment { commentId: $commentId })
            RETURN r, c
            `,
            {
                commentId: this.commentId,
            }
        );

        this.pinned = queryResult.records.length > 0;
        return this.pinned;
    }

    public async getUserVote(userId): Promise<Nullable<VoteType>> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId })-[r:${UserToCommentRelTypes.UPVOTES}|${UserToCommentRelTypes.DOWN_VOTES}]->(c:Comment { commentId: $commentId }) 
            RETURN r
            `,
            {
                userId,
                commentId: this.commentId,
            }
        );

        if (queryResult.records.length > 0) {
            // user has already voted on this comment
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
            MATCH (u:User)-[n:${UserToCommentRelTypes.UPVOTES}]->(c:Comment { commentId: $commentId }) 
                RETURN COUNT(n) as totalVotes
            `,
            {
                commentId: this.commentId,
            }
        );
        const upVotes = queryResult.records[0].get("totalVotes");
        const queryResult2 = await this.neo4jService.tryReadAsync(
            `
            MATCH (u:User)-[n:${UserToCommentRelTypes.DOWN_VOTES}]->(c:Comment { commentId: $commentId })
                RETURN COUNT(n) as totalVotes
            `,
            {
                commentId: this.commentId,
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
            MATCH (c:Comment {commentId: $commentId})<-[r:${UserToCommentRelTypes.AUTHORED}]-(u:User)
            RETURN u, r
            `,
            {
                commentId: this.commentId,
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
            MATCH (c:Comment {commentId: $commentId})-[r:${_ToSelfRelTypes.DELETED}]->(c)
            RETURN r
            `,
            {
                commentId: this.commentId,
            }
        );
        if (queryResult.records.length === 0) return null;
        const result = new DeletedProps(queryResult.records[0].get("r").properties);
        this.deletedProps = result;
        return result;
    }

    public async setDeletedProps(deletedProps: DeletedProps): Promise<void> {
        await this.neo4jService.tryWriteAsync(
            `
            MATCH (c:Comment {commentId: $commentId})
            MERGE (c)-[r:${_ToSelfRelTypes.DELETED}]->(c)
            SET r = $deletedProps
            `,
            {
                commentId: this.commentId,
                deletedProps,
            }
        );
        this.deletedProps = deletedProps;
    }

    public async getRestricted(): Promise<Nullable<RestrictedProps>> {
        const queryResult = await this.neo4jService.tryReadAsync(
            `
            MATCH (c:Comment {commentId: $commentId})-[r:${_ToSelfRelTypes.RESTRICTED}]->(c)
            RETURN r
            `,
            {
                commentId: this.commentId,
            }
        );
        if (queryResult.records.length === 0) return null;
        const result = new RestrictedProps(queryResult.records[0].get("r").properties);
        this.restrictedProps = result;
        return result;
    }
}

interface ToJSONProps {
    authenticatedUserId?: string;
}
