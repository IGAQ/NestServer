import { Inject, Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { RelatedEntityRecordItem } from "../../neo4j/neo4j.helper.types";
import { Neo4jService } from "src/neo4j/neo4j.service";
import { PostToSelfRelTypes, RestrictedProps } from "../models/toSelf";
import { PostToPostTypeRelTypes } from "../models/toPostType";
import { PostToPostTagRelTypes } from "../models/toTags";
import { PostToAwardRelTypes } from "../models/toAward";
import { PostTag, PostType, Post } from "../models";

@Injectable()
export class PostsRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Post[]> {
        const allPosts = await this._neo4jService.read(
            `MATCH (p:Post)-[restrictedProps:${PostToSelfRelTypes.RESTRICTED}]->(p)
            MATCH (p)-[:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(postType:PostType)
            MATCH (p)-[:${PostToPostTagRelTypes.HAS_POST_TAG}]->(postTag:PostTag)
            MATCH (p)-[hasAwardRel:${PostToAwardRelTypes.HAS_AWARD}]->(award:Award)
            RETURN p, restrictedProps, postType, postTag, award, hasAwardRel`,
            {}
        );
        let records = allPosts.records;
        console.log(records, "records for findAll");
        if (records.length === 0) return [];
        return records.map(record => {
            let awards = record.get("award");
            let hasAwardRel = record.get("hasAwardRel");

            console.log(awards, "awards");
            console.log(hasAwardRel, "hasAwardRel");

            let decoratedAwards = awards.map((award, index) => {
                return new RelatedEntityRecordItem(award, hasAwardRel[index]);
            });

            return new Post({
                ...record.get("p").properties,
                postType: new PostType(record.get("postType").properties),
                postTags: new PostTag(record.get("postTag").properties),
                awards: {
                    [PostToAwardRelTypes.HAS_AWARD]: decoratedAwards,
                },
                restrictedProps: record.get("restrictedProps")?.properties ?? null,
            });
        });
    }

    public async findPostById(postId: string): Promise<Post | undefined> {
        const post = await this._neo4jService.read(
            `MATCH (p:Post {postId: $postId})-[restrictedProp:${PostToSelfRelTypes.RESTRICTED}]->(p) 
            MATCH (p)-[:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(postType:PostType)
            MATCH (p)-[:${PostToPostTagRelTypes.HAS_POST_TAG}]->(postTag:PostTag)
            MATCH (p)-[hasAwardRel:${PostToAwardRelTypes.HAS_AWARD}]->(award:Award)
            RETURN p, restrictedProps, postType, postTag, award, hasAwardRel`,
            {
                postId: postId,
            }
        );
        if (post.records.length === 0) return undefined;
        let record = post.records[0];
        return new Post({
            ...record.get("p").properties,
            restrictedProps: record.get("restrictedProp")?.properties ?? null,
        });
    }

    public async addPost(post: Post): Promise<void> {
        this._neo4jService.write(
            `
            CREATE (p:Post {
	            postId: $postId,
	            updatedAt: $updatedAt,
	            postContent: $postContent,
                postTitle: $postTitle,
                pending: $pending
            })
            WITH [$withClause] AS postTagsToBeConnected
            UNWIND postTagsToBeConnected as x
                MATCH (postType:PostType) WHERE postType.typeId = $postTypeId
                MATCH (postTag:PostTag) WHERE postTag.tagName = x
                MATCH (p1:Post) WHERE p1.postId = $postId
                    MERGE (p1)-[:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(postType)
                    CREATE (p1)-[:${PostToPostTagRelTypes.HAS_POST_TAG}]->(postTag)
		`,
            {
                withClause: post.postTags.map(p => `"${p.tagName}"`).join(","),

                // Post
                postId: uuidv4(),

                updatedAt: new Date().getTime(),

                postContent: post.postContent,
                postTitle: post.postTitle,

                pending: false,

                // Post.postType
                postTypeId: post.postType.postTypeId,
            }
        );
    }

    public async restrictPost(postId: string, restrictedProps: RestrictedProps): Promise<void> {
        this._neo4jService.write(
            `MATCH (p:Post) WHERE p.postId = $postId 
            CREATE (p)-[r:${PostToSelfRelTypes.RESTRICTED} {
                restrictedAt: $restrictedAt,
                moderatorId: $moderatorId,
                reason: $reason,
            }]->(p)`,
            {
                postId: postId,
                restrictedAt: restrictedProps.restrictedAt,
                moderatorId: restrictedProps.moderatorId,
                reason: restrictedProps.reason,
            }
        );
    }
}
