import { Inject, Injectable } from "@nestjs/common";
import { IPostsRepository } from "./posts.repository.inerface";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { _ToSelfRelTypes, RestrictedProps } from "../../../_domain/models/toSelf";
import { PostToPostTypeRelTypes } from "../../models/toPostType";
import { PostToPostTagRelTypes } from "../../models/toTags";
import { HasAwardProps, PostToAwardRelTypes } from "../../models/toAward";
import { Post } from "../../models";
import { AuthoredProps, UserToPostRelTypes } from "../../../users/models/toPost";

@Injectable()
export class PostsRepository implements IPostsRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Post[]> {
        const allPosts = await this._neo4jService.read(`MATCH (p:Post) RETURN p`, {});
        let records = allPosts.records;
        if (records.length === 0) return [];
        return records.map(record => new Post(record.get("p").properties, this._neo4jService));
    }

    public async findPostById(postId: string): Promise<Post | undefined> {
        const post = await this._neo4jService.read(
            `MATCH (p:Post) WHERE p.postId = $postId RETURN p`,
            { postId: postId }
        );
        if (post.records.length === 0) return undefined;
        return new Post(post.records[0].get("p").properties, this._neo4jService);
    }

    public async addPost(post: Post, anonymous: boolean): Promise<void> {
        let restrictedQueryString = "";
        let restrictedQueryParams = {};
        if (post.restrictedProps !== null) {
            restrictedQueryString = `-[:${_ToSelfRelTypes.RESTRICTED} { 
                    restrictedAt: $restrictedAt, 
                    moderatorId: $moderatorId,
                    reason: $reason
                 }]->(p)`;
            restrictedQueryParams = {
                restrictedAt: post.restrictedProps.restrictedAt,
                moderatorId: post.restrictedProps.moderatorId,
                reason: post.restrictedProps.reason,
            } as RestrictedProps;
        }

        const authoredProps = new AuthoredProps({
            authoredAt: new Date().getTime(),
            anonymously: anonymous,
        });
        await this._neo4jService.tryWriteAsync(
            `
                MATCH (u:User { userId: $userId })
                CREATE (p:Post {
                    postId: $postId,
                    updatedAt: $updatedAt,
                    postTitle: $postTitle,
                    postContent: $postContent,
                    pending: $pending
                })${restrictedQueryString}<-[authoredRelationship:${UserToPostRelTypes.AUTHORED} {
                    authoredAt: $authoredProps_authoredAt,
                    anonymously: $authoredProps_anonymously
                 }]-(u)
                WITH [${post.postTags
                    .map(pt => `"${pt.tagId}"`)
                    .join(",")}] AS postTagIDsToBeConnected
                UNWIND postTagIDsToBeConnected as postTagIdToBeConnected
                    MATCH (p1:Post) WHERE p1.postId = $postId
                    MATCH (postType:PostType) WHERE postType.postTypeId = $postTypeId
                    MATCH (postTag:PostTag) WHERE postTag.tagId = postTagIdToBeConnected
                        MERGE (p1)-[:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(postType)
                        MERGE (p1)-[:${PostToPostTagRelTypes.HAS_POST_TAG}]->(postTag)
                WITH [${post.awards[PostToAwardRelTypes.HAS_AWARD].records
                    .map(record => `"${record.entity.awardId}"`)
                    .join(",")}] AS awardIDsToBeConnected       
                UNWIND awardIDsToBeConnected as awardIdToBeConnected
                    MATCH (p1:Post) WHERE p1.postId = $postId
                    MATCH (award:Award) WHERE award.awardId = awardIdToBeConnected
                        MERGE (p1)-[:${PostToAwardRelTypes.HAS_AWARD} { awardedBy: "${
                (post.awards[PostToAwardRelTypes.HAS_AWARD].records[0].relProps as HasAwardProps)
                    .awardedBy
            }" } ]->(award)
            `,
            {
                // Post Author User
                userId: post.authorUser.userId,

                // Post
                postId: post.postId,
                updatedAt: post.updatedAt,
                postTitle: post.postTitle,
                postContent: post.postContent,
                pending: post.pending,

                // PostType
                postTypeId: post.postType.postTypeId,

                // AuthoredProps
                authoredProps_authoredAt: authoredProps.authoredAt,
                authoredProps_anonymously: authoredProps.anonymously,

                // RestrictedProps (if applicable)
                ...restrictedQueryParams,
            }
        );
    }

    public async deletePost(postId: string): Promise<void> {
        this._neo4jService.write(`MATCH (p:Post) WHERE p.postId = $postId DETACH DELETE p`, {
            postId: postId,
        });
    }

    public async restrictPost(postId: string, restrictedProps: RestrictedProps): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `MATCH (p:Post) WHERE p.postId = $postId 
            CREATE (p)-[r:${_ToSelfRelTypes.RESTRICTED} {
                restrictedAt: $restrictedAt,
                moderatorId: $moderatorId,
                reason: $reason
            }]->(p)`,
            {
                postId: postId,
                restrictedAt: restrictedProps.restrictedAt,
                moderatorId: restrictedProps.moderatorId,
                reason: restrictedProps.reason,
            }
        );
    }

    public async unrestrictPost(postId: string): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `MATCH (p:Post)-[r:${_ToSelfRelTypes.RESTRICTED}]->(p) WHERE p.postId = $postId DELETE r`,
            {
                postId: postId,
            }
        );
    }
}
