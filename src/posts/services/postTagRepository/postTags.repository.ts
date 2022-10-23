import { IPostTagsRepository } from "./postTags.repository.interface";
import { PostTag } from "../../models";
import { IPostsRepository } from "../postRepository/posts.repository.inerface";
import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "src/neo4j/services/neo4j.service";
import { v4 as uuidv4 } from "uuid";
import { _$ } from "src/_domain/injectableTokens";

@Injectable()
export class PostTagsRepository implements IPostTagsRepository {

    constructor(
        @Inject(Neo4jService) private _neo4jService: Neo4jService,
        @Inject(_$.IPostsRepository) private _usersRepository: IPostsRepository
    ) {}

    public async findAll(): Promise<PostTag[]> {
        const allPostTags = await this._neo4jService.read(`MATCH (t:PostTag) RETURN t`, {});
        let records = allPostTags.records;
        if (records.length === 0) return [];
        return records.map(record => new PostTag(record.get("t").properties));
    }

    public async getPostTagsByPostId(postId: string): Promise<PostTag[]> {
        const post = await this._usersRepository.findPostById(postId);
        const postTagsOfPost = await post.getPostTags();
        return postTagsOfPost;
    }

    public async getPostTagByTagId(tagId: string): Promise<PostTag | undefined> {
        const postTag = await this._neo4jService.read(
            `MATCH (t:PostTag) WHERE t.tagId = $tagId RETURN t`,
            { tagId: tagId }
        );
        if (postTag.records.length === 0) return undefined;
        return new PostTag(postTag.records[0].get("t").properties);
    }

    public async addPostTag(postTag: PostTag): Promise<PostTag> {
        const tagId = uuidv4();
        await this._neo4jService.tryWriteAsync(
            `
            CREATE (t:PostTag {
                tagId: $tagId,
                tagName: $tagName,
                postTagFlagSvg: $postTagFlagSvg
            })
        `,
            {
                // PostTag
                tagId: postTag.tagId ?? tagId,

                tagName: postTag.tagName,

                tagColor: postTag.tagColor,
            }
        );

        const addedPostTag = await this.getPostTagByTagId(postTag.tagId ?? tagId);

        return addedPostTag;
    }

    public async updatePostTag(postTag: PostTag): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (t:PostTag) WHERE t.tagId = $tagId
            SET t.tagName = $tagName,
                t.tagColor = $tagColor
        `,
            {
                // PostTag
                tagId: postTag.tagId,

                tagName: postTag.tagName,

                tagColor: postTag.tagColor,
            }
        );
    }

    public async deletePostTag(tagId: string): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (t:PostTag) WHERE t.tagId = $tagId
            DETACH DELETE t
        `,
            {
                // PostTag
                tagId: tagId,
            }
        );
    }
}
