import { Inject, Injectable } from "@nestjs/common";
import { IGenderRepository } from "./gender.repository.interface";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Gender } from "../../models";

@Injectable()
export class GenderRepository implements IGenderRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Gender[]> {
        const allGenders = await this._neo4jService.tryReadAsync(`MATCH (g:Gender) RETURN g`, {});
        const records = allGenders.records;
        if (records.length === 0) return [];
        return records.map(record => new Gender(record.get("g").properties));
    }

    public async findGenderById(genderId: UUID): Promise<Gender | undefined> {
        const gender = await this._neo4jService.tryReadAsync(
            `MATCH (g:Gender) WHERE g.genderId = $genderId RETURN g`,
            { genderId: genderId }
        );
        if (gender.records.length === 0) return undefined;
        return new Gender(gender.records[0].get("g").properties);
    }

    public async addGender(gender: Gender): Promise<Gender> {
        const genderId = this._neo4jService.generateId();
        await this._neo4jService.tryWriteAsync(
            `
            CREATE (g:Gender {
                genderId: $genderId,
                genderName: $genderName,
                genderPronouns: $genderPronouns,
                genderFlagSvg: $genderFlagSvg
            })
        `,
            {
                // Gender
                genderId: gender.genderId ?? genderId,

                genderName: gender.genderName,

                genderPronouns: gender.genderPronouns,

                genderFlagSvg: gender.genderFlagSvg,
            }
        );

        return await this.findGenderById(gender.genderId ?? genderId);
    }

    public async updateGender(gender: Gender): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (g:Gender) WHERE g.genderId = $genderId
            SET g.genderName = $genderName,
                g.genderPronouns = $genderPronouns,
                g.genderFlagSvg = $genderFlagSvg
        `,
            {
                // Gender
                genderId: gender.genderId,

                genderName: gender.genderName,

                genderPronouns: gender.genderPronouns,

                genderFlagSvg: gender.genderFlagSvg,
            }
        );
    }

    public async deleteGender(genderId: UUID): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (g:Gender) WHERE g.genderId = $genderId
            DETACH DELETE g
        `,
            {
                // Gender
                genderId: genderId,
            }
        );
    }
}
