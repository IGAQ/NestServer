import { HttpException, Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { AuthoredProps, UserToCommentRelTypes } from "../../../users/models/toComment";
import { RestrictedProps, _ToSelfRelTypes, DeletedProps } from "../../../_domain/models/toSelf";
import { Comment } from "../../models";
import { CommentToSelfRelTypes } from "../../models/toSelf";
import { ICommentsRepository } from "./comments.repository.interface";
import { PostToCommentRelTypes } from "../../../posts/models/toComment";
import { Post } from "../../../posts/models";

@Injectable()
export class CommentsRepository implements ICommentsRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Comment[]> {
        const allComments = await this._neo4jService.tryReadAsync(`MATCH (c:Comment) RETURN c`, {});
        const records = allComments.records;
        if (records.length === 0) return [];
        return records.map(record => new Comment(record.get("c").properties, this._neo4jService));
    }

    public async findCommentById(commentId: string): Promise<Comment | undefined> {
        const comment = await this._neo4jService.tryReadAsync(
            `MATCH (c:Comment) WHERE c.commentId = $commentId RETURN c`,
            { commentId: commentId }
        );
        if (comment.records.length === 0) return undefined;
        return new Comment(comment.records[0].get("c").properties, this._neo4jService);
    }

    public async updateComment(comment: Comment): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (c:Comment) WHERE c.commentId = $commentId
                SET c.updatedAt = $updatedAt,
                    c.commentContent = $commentContent,
                    c.pending = $pending
            `,
            {
                commentId: comment.commentId,
                updatedAt: Date.now(),
                commentContent: comment.commentContent,
                pending: comment.pending,
            }
        );
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
                    authoredAt: $authoredProps_authoredAt
                }]-(u),
                (c)-[:${CommentToSelfRelTypes.REPLIED}]->(commentParent) 
            `,
            {
                // Comment properties
                commentId: comment.commentId,
                updatedAt: comment.updatedAt,
                commentContent: comment.commentContent,

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
                    authoredAt: $authoredProps_authoredAt
                }]-(u),
                (c)<-[:${PostToCommentRelTypes.HAS_COMMENT}]-(parentPost)
            `,
            {
                // Comment properties
                commentId: comment.commentId,
                updatedAt: comment.updatedAt,
                commentContent: comment.commentContent,

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

    public async deleteComment(commentId: UUID): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `MATCH (c:Comment { commentId: $commentId }) DETACH DELETE c`,
            { commentId: commentId }
        );
    }

    public async restrictComment(commentId: UUID, restrictedProps: RestrictedProps): Promise<void> {
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

    public async unrestrictComment(commentId: UUID): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `MATCH (c:Comment { commentId: $commentId })-[r:${_ToSelfRelTypes.RESTRICTED}]->(c) DELETE r`,
            { commentId: commentId }
        );
    }

    public async markAsDeleted(commentId: UUID, deletedProps: DeletedProps): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (c:Comment {commentId: $commentId})
            MERGE (c)-[r:${_ToSelfRelTypes.DELETED}]->(c)
            SET r = $deletedProps
            `,
            {
                commentId,
                deletedProps,
            }
        );
    }

    public async removeDeletedMark(commentId: UUID): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (c:Comment {commentId: $commentId})-[r:${_ToSelfRelTypes.DELETED}]->(c)
            DELETE r
            `,
            {
                commentId,
            }
        );
    }
    // throw new HttpException("Post not found", 404);
    public async findParentPost(commentId: UUID): Promise<Post | undefined> {
        const parentPost = await this._neo4jService.tryReadAsync(
            `
            MATCH (p:Post)-[:${PostToCommentRelTypes.HAS_COMMENT}]->(c:Comment { commentId: $commentId })
            RETURN p
            `,
            {
                commentId,
            }
        );

        if (parentPost.records.length === 0) {
            return undefined;
        }
        return new Post(parentPost.records[0].get("p").properties, this._neo4jService);
    }
}
