import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { AuthoredProps, UserToCommentRelTypes } from "../../../users/models/toComment";
import { RestrictedProps, _ToSelfRelTypes } from "../../../_domain/models/toSelf";
import { Comment } from "../../models";
import { CommentToSelfRelTypes } from "../../models/toSelf";
import { ICommentsRepository } from "./comments.repository.interface";
import { PostToCommentRelTypes } from "../../../posts/models/toComment";

@Injectable()
export class CommentsRepository implements ICommentsRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Comment[]> {
        const allComments = await this._neo4jService.read(`MATCH (c:Comment) RETURN c`, {});
        const records = allComments.records;
        if (records.length === 0) return [];
        return records.map(record => new Comment(record.get("c").properties, this._neo4jService));
    }

    public async findCommentById(commentId: string): Promise<Comment | undefined> {
        const comment = await this._neo4jService.read(
            `MATCH (c:Comment) WHERE c.commentId = $commentId RETURN c`,
            { commentId: commentId }
        );
        if (comment.records.length === 0) return undefined;
        return new Comment(comment.records[0].get("c").properties, this._neo4jService);
    }

    public async addCommentToComment(comment: Comment): Promise<Comment> {
        if (comment.commentId === undefined) {
            comment.commentId = this._neo4jService.generateId();
        }
        let restrictedQueryString = "";
        let restrictedQueryParams = {};
        if (comment.restrictedProps !== null) {
            restrictedQueryString = `-[:${_ToSelfRelTypes.RESTRICTED} { 
                    restrictedAt: $restrictedAt, 
                    moderatorId: $moderatorId,
                    reason: $reason
                 }]->(c)`;
            restrictedQueryParams = {
                restrictedAt: comment.restrictedProps.restrictedAt,
                moderatorId: comment.restrictedProps.moderatorId,
                reason: comment.restrictedProps.reason,
            } as RestrictedProps;
        }
        const authoredProps = new AuthoredProps({
            authoredAt: new Date().getTime(),
        });
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (u:User { userId: $userId })
                MATCH (commentParent:Comment { commentId: $parentId })
                CREATE (c:Comment {
                    commentId: $commentId,
                    updatedAt: $updatedAt,
                    commentContent: $commentContent,
                    pending: $pending
                })${restrictedQueryString}<-[:${UserToCommentRelTypes.AUTHORED} {
                    authoredAt: $authoredAt
                }]-(u),
                (c)-[:${CommentToSelfRelTypes.REPLIED}]->(commentParent) 
            `,
            {
                // Comment properties
                commentId: comment.commentId,
                updatedAt: comment.updatedAt,
                commentContent: comment.commentContent,
                authoredAt: authoredProps.authoredAt,

                // Parent
                parentId: comment.parentId,

                pending: comment.pending,
                // User properties
                userId: comment.authorUser.userId,

                // Authored properties
                authoredProps_authoredAt: authoredProps.authoredAt ?? new Date().getTime(),

                // RestrictedProps (if applicable)
                ...restrictedQueryParams,
            }
        );
        return await this.findCommentById(comment.commentId);
    }

    public async addCommentToPost(comment: Comment): Promise<Comment> {
        if (comment.commentId === undefined) {
            comment.commentId = this._neo4jService.generateId();
        }
        let restrictedQueryString = "";
        let restrictedQueryParams = {};
        if (comment.restrictedProps !== null) {
            restrictedQueryString = `-[:${_ToSelfRelTypes.RESTRICTED} { 
                    restrictedAt: $restrictedAt, 
                    moderatorId: $moderatorId,
                    reason: $reason
                 }]->(c)`;
            restrictedQueryParams = {
                restrictedAt: comment.restrictedProps.restrictedAt,
                moderatorId: comment.restrictedProps.moderatorId,
                reason: comment.restrictedProps.reason,
            } as RestrictedProps;
        }
        const authoredProps = new AuthoredProps({
            authoredAt: new Date().getTime(),
        });
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (u:User { userId: $userId })
                MATCH (parentPost:Post { postId: $parentId })
                CREATE (c:Comment {
                    commentId: $commentId,
                    updatedAt: $updatedAt,
                    commentContent: $commentContent,
                    pending: $pending
                })${restrictedQueryString}<-[:${UserToCommentRelTypes.AUTHORED} {
                    authoredAt: $authoredAt
                }]-(u),
                (c)<-[:${PostToCommentRelTypes.HAS_COMMENT}]-(parentPost)
            `,
            {
                // Comment properties
                commentId: comment.commentId,
                updatedAt: comment.updatedAt,
                commentContent: comment.commentContent,
                authoredAt: authoredProps.authoredAt,

                pending: comment.pending,

                // Parent
                parentId: comment.parentId,

                // User properties
                userId: comment.authorUser.userId,

                // Authored properties
                authoredProps_authoredAt: authoredProps.authoredAt ?? new Date().getTime(),

                // RestrictedProps (if applicable)
                ...restrictedQueryParams,
            }
        );
        return await this.findCommentById(comment.commentId);
    }

    public async deleteComment(commentId: string): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `MATCH (c:Comment { commentId: $commentId }) DETACH DELETE c`,
            { commentId: commentId }
        );
    }

    public async restrictComment(
        commentId: string,
        restrictedProps: RestrictedProps
    ): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `MATCH (c:Comment { commentId: $commentId }) 
             CREATE (c)-[:${_ToSelfRelTypes.RESTRICTED} {
                restrictedAt: $restrictedAt,
                moderatorId: $moderatorId,
                reason: $reason
             }]->(c)`,
            {
                commentId: commentId,
                restrictedAt: restrictedProps.restrictedAt,
                moderatorId: restrictedProps.moderatorId,
                reason: restrictedProps.reason,
            }
        );
    }

    public async unrestrictComment(commentId: string): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `MATCH (c:Comment { commentId: $commentId })-[r:${_ToSelfRelTypes.RESTRICTED}]->(c) DELETE r`,
            { commentId: commentId }
        );
    }
}
