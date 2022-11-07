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

    public async findPostTagByName(tagName: string): Promise<PostTag | undefined> {
        const queryResult = await this._neo4jService.tryReadAsync(
            `MATCH (t:PostTag) WHERE t.tagName = $tagName RETURN t`,
            { tagName: tagName.trim().toLowerCase() }
        );
        if (queryResult.records.length === 0) return undefined;
        return new PostTag(queryResult.records[0].get("t").properties);
    }

    public async addPostTag(postTag: PostTag): Promise<PostTag> {
        await this._neo4jService.tryWriteAsync(
            `
            CREATE (t:PostTag {
                tagName: $tagName,
                tagColor: $tagColor
            })
        `,
            {
                tagName: postTag.tagName.trim().toLowerCase(),
                tagColor: postTag.tagColor,
            }
        );

        return await this.findPostTagByName(postTag.tagName);
    }

    public async updatePostTag(postTag: PostTag): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (t:PostTag) WHERE t.tagName = $tagName
            SET t.tagName = $tagName,
                t.tagColor = $tagColor
        `,
            {
                tagName: postTag.tagName.trim().toLowerCase(),
                tagColor: postTag.tagColor,
            }
        );
    }

    public async deletePostTag(tagName: string): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (t:PostTag) WHERE t.tagName = $tagName
            DETACH DELETE t
        `,
            { tagName: tagName.trim().toLowerCase() }
        );
    }
}
