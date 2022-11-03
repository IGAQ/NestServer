import { IPostTypesRepository } from "./postTypes.repository.interface";
import { PostType } from "../../models";
import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";

@Injectable()
export class PostTypesRepository implements IPostTypesRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<PostType[]> {
        const allPostTypes = await this._neo4jService.read(`MATCH (t:PostType) RETURN t`, {});
        const records = allPostTypes.records;
        if (records.length === 0) return [];
        return records.map(record => new PostType(record.get("t").properties));
    }

    public async findPostTypeById(postTypeId: string): Promise<PostType | undefined> {
        const postType = await this._neo4jService.read(
            `MATCH (t:PostType) WHERE t.postTypeId = $postTypeId RETURN t`,
            { postTypeId: postTypeId }
        );
        if (postType.records.length === 0) return undefined;
        return new PostType(postType.records[0].get("t").properties);
    }
}
