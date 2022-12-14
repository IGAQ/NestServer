import { IPostTypesRepository } from "./postTypes.repository.interface";
import { PostType } from "../../models";
import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";

@Injectable()
export class PostTypesRepository implements IPostTypesRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<PostType[]> {
        const allPostTypes = await this._neo4jService.tryReadAsync(
            `MATCH (t:PostType) RETURN t`,
            {}
        );
        const records = allPostTypes.records;
        if (records.length === 0) return [];
        return records.map(record => new PostType(record.get("t").properties));
    }

    public async findPostTypeByName(postTypeName: string): Promise<PostType | undefined> {
        const postType = await this._neo4jService.tryReadAsync(
            `MATCH (pt:PostType) WHERE pt.postTypeName = $postTypeName RETURN pt`,
            {
                postTypeName: postTypeName.trim().toLowerCase(),
            }
        );

        if (postType.records.length === 0) return undefined;
        return new PostType(postType.records[0].get("pt").properties);
    }
}
