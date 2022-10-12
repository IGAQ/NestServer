import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "src/neo4j/neo4j.service";
import { v4 as uuidv4 } from "uuid";
import { Post } from "../models/post";

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
        const foundPost = post.records[0].get("p").properties;
        return foundPost;
    }

    public async addPost(post: any): Promise<void> {
        this._neo4jService.write(
            `CREATE (p:Post {
			postId: $postId,
			createdAt: $createdAt,
			updatedAt: $updatedAt,
			postContent: $postContent,
            postTitle: $postTitle,
            restricted: $restricted,
            pending: $pending,
		})`,
            {
                postId: uuidv4(),

                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),

                postContent: post.content,
                postTitle: post.title,

                restricted: false,
                pending: false,
            } as Omit<any, "posts">
        );
    }

    // Edit is not implemented yet
    // public async updatePost(post: Post): Promise<void> {
    //     this._neo4jService.write(
    //         `MATCH (p:Post {postId: $postId})
    // 	SET
    // 		p.postTitle = $postTitle,
    // 		p.postContent = $postContent,
    // 		p.restricted = $restricted,
    // 		p.pending = $pending,
    // 		p.updatedAt = $updatedAt
    // 	`,
    //         {
    //             postTitle: post.title,
    //             postContent: post.content,
    //             restricted: post.restricted,
    //             pending: post.pending,
    //             updatedAt: new Date().getTime(),
    //         } as Omit<any, "posts" | "postId" | "createdAt">
    //     );
    // }

    public async deleteUser(postId: string): Promise<void> {
        this._neo4jService.write(`MATCH (p:User {postId: $postId}) DETACH DELETE p`, {
            postId: postId,
        });
    }
}
