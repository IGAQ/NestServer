import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Labels, NodeProperty } from "../../neo4j/neo4j.decorators";
import { Model } from "../../neo4j/neo4j.helper.types";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { User } from "../../users/models";
import { AuthoredProps, UserToCommentRelTypes } from "../../users/models/toComment";
import { RestrictedProps, _ToSelfRelTypes } from "../../_domain/models/toSelf";
import { CommentToSelfRelTypes, DeletedProps } from "./toSelf";
import { PublicUserDto } from "../../users/dtos";
import neo4j from "neo4j-driver";
import { VoteType } from "../../_domain/models/enums";
import { IsOptional } from "class-validator";

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
    authorUser: User | any;

    @ApiProperty({ type: Boolean })
    @NodeProperty()
    pending: boolean;

    @ApiProperty({ type: Number })
    totalVotes: number;

    @ApiProperty({ type: Number })
    @IsOptional()
    totalComments: number | undefined;

    @ApiProperty({ type: RestrictedProps })
    restrictedProps: Nullable<RestrictedProps> = null;

    @ApiProperty({ type: Comment })
    childComments: Comment[];

    @ApiProperty({ type: VoteType, nullable: true })
    @IsOptional()
    userVote: Nullable<VoteType> | undefined = undefined;

    @ApiProperty({ type: Boolean })
    @NodeProperty()
    @Exclude()
    deletedProps: Nullable<DeletedProps> = null;

    constructor(partial?: Partial<Comment>, neo4jService?: Neo4jService) {
        super(neo4jService);
        Object.assign(this, partial);
    }

    public async toJSON(props: ToJSONProps = {}) {
        if (this.neo4jService) {
            await Promise.all([
                this.getRestricted(),
                this.getCreatedAt(),
                this.getTotalVotes(),
                this.getAuthorUser(),
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
            }]->(p:Comment) WHERE p.commentId = $parentId 
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
            MATCH (c:Comment {commentId: $commentId})-[r:${CommentToSelfRelTypes.DELETED}]->(c)
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
            MERGE (c)-[r:${CommentToSelfRelTypes.DELETED}]->(c)
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
