import { Inject, Injectable } from "@nestjs/common";
import { ISexualityRepository } from "./sexuality.repository.interface";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Sexuality } from "../../models";

@Injectable()
export class SexualityRepository implements ISexualityRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Sexuality[]> {
        const allSexualities = await this._neo4jService.tryReadAsync(
            `MATCH (s:Sexuality) RETURN s`,
            {}
        );
        const records = allSexualities.records;
        if (records.length === 0) return [];
        return records.map(record => new Sexuality(record.get("s").properties));
    }

    public async findSexualityById(sexualityId: UUID): Promise<Sexuality | undefined> {
        const sexuality = await this._neo4jService.tryReadAsync(
            `MATCH (s:Sexuality) WHERE s.sexualityId = $sexualityId RETURN s`,
            { sexualityId: sexualityId }
        );
        if (sexuality.records.length === 0) return undefined;
        return new Sexuality(sexuality.records[0].get("s").properties);
    }

    public async addSexuality(sexuality: Sexuality): Promise<Sexuality> {
        const sexualityId = this._neo4jService.generateId();
        await this._neo4jService.tryWriteAsync(
            `
            CREATE (s:Sexuality {
                sexualityId: $sexualityId,
                sexualityName: $sexualityName,
                sexualityFlagSvg: $sexualityFlagSvg
            })
        `,
            {
                // Sexuality
                sexualityId: sexuality.sexualityId ?? sexualityId,

                sexualityName: sexuality.sexualityName,

                sexualityFlagSvg: sexuality.sexualityFlagSvg,
            }
        );

        const addedSexuality = await this.findSexualityById(sexuality.sexualityId ?? sexualityId);

        return addedSexuality;
    }

    public async updateSexuality(sexuality: Sexuality): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (s:Sexuality) WHERE s.sexualityId = $sexualityId
            SET s.sexualityName = $sexualityName,
                s.sexualityFlagSvg = $sexualityFlagSvg
        `,
            {
                // Sexuality
                sexualityId: sexuality.sexualityId,

                sexualityName: sexuality.sexualityName,

                sexualityFlagSvg: sexuality.sexualityFlagSvg,
            }
        );
    }

    public async deleteSexuality(sexualityId: UUID): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (s:Sexuality) WHERE s.sexualityId = $sexualityId
            DETACH DELETE s
        `,
            {
                // Sexuality
                sexualityId: sexualityId,
            }
        );
    }
}
