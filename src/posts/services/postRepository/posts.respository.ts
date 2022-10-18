import { Inject, Injectable } from "@nestjs/common";
import { IPostsRepository } from "./posts.repository.inerface";
import { v4 as uuidv4 } from "uuid";
import { RelatedEntityRecordItem } from "../../../neo4j/neo4j.helper.types";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { _ToSelfRelTypes, RestrictedProps } from "../../../common/models/toSelf";
import { PostToPostTypeRelTypes } from "../../models/toPostType";
import { PostToPostTagRelTypes } from "../../models/toTags";
import { HasAwardProps, PostToAwardRelTypes } from "../../models/toAward";
import { PostTag, PostType, Post, Award } from "../../models";

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
            WITH [${post.postTags.map(p => `"${p.tagId}"`).join(",")}] AS postTagsToBeConnected
            UNWIND postTagsToBeConnected as x
                MATCH (postType:PostType) WHERE postType.typeId = $postTypeId
                MATCH (postTag:PostTag) WHERE postTag.tagId = x
                MATCH (p1:Post) WHERE p1.postId = $postId
                    MERGE (p1)-[:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(postType)
                    CREATE (p1)-[:${PostToPostTagRelTypes.HAS_POST_TAG}]->(postTag)
		`,
            {
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
            CREATE (p)-[r:${_ToSelfRelTypes.RESTRICTED} {
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

