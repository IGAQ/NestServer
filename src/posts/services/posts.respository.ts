import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "src/neo4j/neo4j.service";
import { v4 as uuidv4 } from "uuid";
import { Post } from "../models";
import { PostToSelfRelTypes, RestrictedProps } from "../models/toSelf";

@Injectable()
export class PostsRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Post[]> {
        const allPosts = await this._neo4jService.read(`MATCH (p:Post) RETURN p`, {});
        console.debug(allPosts);
        return allPosts.records[0]?.get("p").properties ?? [];
    }

    public async findPostById(postId: string): Promise<Post | undefined> {
        const post = await this._neo4jService.read(`MATCH (p:Post {postId: $postId}) RETURN p`, {
            postId: postId,
        });
        if (post.records.length === 0) return undefined;
        return new Post(post.records[0].get("p").properties);
    }

    public async addPost(post: Post): Promise<void> {
        this._neo4jService.write(
            `CREATE (p:Post {
			postId: $postId,
			createdAt: $createdAt,
			updatedAt: $updatedAt,
			postContent: $postContent,
            postTitle: $postTitle,
            pending: $pending,
		})`,
            {
                postId: uuidv4(),

                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),

                postContent: post.postContent,
                postTitle: post.postTitle,

                restricted: false,
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
