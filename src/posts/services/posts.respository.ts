import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "src/neo4j/neo4j.service";
import { v4 as uuidv4 } from "uuid";
import { Post } from "../models";
import { PostToSelfRelTypes, RestrictedProps } from "../models/toSelf";

@Injectable()
export class PostsRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Post[]> {
        const allPosts = await this._neo4jService.read(
            `MATCH (p:Post)-[restrictedProps:${PostToSelfRelTypes.RESTRICTED}]->(p) RETURN p, restrictedProps`,
            {}
        );
        let records = allPosts.records;
        if (records.length === 0) return [];
        return records.map((record) => {
            return new Post({
                ...record.get("p").properties,
                restrictedProps: record.get("restrictedProps")?.properties ?? null,
            });
        });
    }

    public async findPostById(postId: string): Promise<Post | undefined> {
        const post = await this._neo4jService.read(
            `MATCH (p:Post {postId: $postId})-[restrictedProp:${PostToSelfRelTypes.RESTRICTED}]->(p) RETURN restrictedProp, p`,
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
            `CREATE (p:Post {
			postId: $postId,
			updatedAt: $updatedAt,
			postContent: $postContent,
            postTitle: $postTitle,
            pending: $pending,
		})`,
            {
                postId: uuidv4(),

                updatedAt: new Date().getTime(),

                postContent: post.postContent,
                postTitle: post.postTitle,

                pending: false,
            } as Omit<any, "posts">
        );
    }

    public async restrictPost(postId: string, restrictedProps: RestrictedProps): Promise<void> {
        this._neo4jService.write(
            `MATCH (p:Post {postId: $postId}) 
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
