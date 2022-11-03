import { IPostAwardRepository } from "./postAward.repository.interface";
import { Award } from "../../models";
import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class PostAwardRepository implements IPostAwardRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Award[]> {
        const allAwards = await this._neo4jService.read(`MATCH (a:Award) RETURN a`, {});
        const records = allAwards.records;
        if (records.length === 0) return [];
        return records.map(record => new Award(record.get("a").properties));
    }

    public async findAwardById(awardId: string): Promise<Award | undefined> {
        const award = await this._neo4jService.read(
            `MATCH (a:Award) WHERE a.awardId = $awardId RETURN a`,
            { awardId: awardId }
        );
        if (award.records.length === 0) return undefined;
        return new Award(award.records[0].get("a").properties);
    }

    public async addAward(award: Award): Promise<Award> {
        const awardId = uuidv4();
        await this._neo4jService.tryWriteAsync(
            `
            CREATE (a:Award {
                awardId: $awardId,
                awardName: $awardName,
                awardSvg: $awardSvg
            })
        `,
            {
                // Award
                awardId: award.awardId ?? awardId,

                awardName: award.awardName,

                awardSvg: award.awardSvg,
            }
        );

        return await this.findAwardById(award.awardId ?? awardId);
    }

    public async updateAward(award: Award): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (a:Award { awardId: $awardId })
            SET a.awardName = $awardName,
                a.awardSvg = $awardSvg
        `,
            {
                // Award
                awardId: award.awardId,

                awardName: award.awardName,

                awardSvg: award.awardSvg,
            }
        );
    }

    public async deleteAward(awardId: string): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (a:Award { awardId: $awardId })
            DETACH DELETE a
        `,
            {
                // Award
                awardId: awardId,
            }
        );
    }
}
