import { IPostTagsRepository } from "./postTags.repository.interface";
import { PostTag } from "../../models";
import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class PostTagsRepository implements IPostTagsRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<PostTag[]> {
        const allPostTags = await this._neo4jService.read(`MATCH (t:PostTag) RETURN t`, {});
        const records = allPostTags.records;
        if (records.length === 0) return [];
        return records.map(record => new PostTag(record.get("t").properties));
    }

    public async findPostTagByTagId(tagId: string): Promise<PostTag | undefined> {
        const postTag = await this._neo4jService.read(
            `MATCH (t:PostTag) WHERE t.tagId = $tagId RETURN t`,
            { tagId: tagId }
        );
        if (postTag.records.length === 0) return undefined;
        return new PostTag(postTag.records[0].get("t").properties);
    }

    public async findPostTagByName(tagName: string): Promise<PostTag | undefined> {
        const queryResult = await this._neo4jService.tryReadAsync(
            `MATCH (t:PostTag) WHERE t.tagName = $tagName RETURN t`,
            { tagName: tagName.trim().toLowerCase() }
        );
        if (queryResult.records.length === 0) return undefined;
        return new PostTag(queryResult.records[0].get("t").properties);
    }

    public async addPostTag(postTag: PostTag): Promise<PostTag> {
        const tagId = uuidv4();
        await this._neo4jService.tryWriteAsync(
            `
            CREATE (t:PostTag {
                tagId: $tagId,
                tagName: $tagName,
                tagColor: $tagColor
            })
        `,
            {
                // PostTag
                tagId: postTag.tagId ?? tagId,

                tagName: postTag.tagName,

                tagColor: postTag.tagColor,
            }
        );

        return await this.findPostTagByTagId(postTag.tagId ?? tagId);
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
