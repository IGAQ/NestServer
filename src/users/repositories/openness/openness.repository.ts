import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Openness } from "../../models";
import { IOpennessRepository } from "./openness.repository.interface";

@Injectable()
export class OpennessRepository implements IOpennessRepository {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    public async findAll(): Promise<Openness[]> {
        const allOpenness = await this._neo4jService.read(`MATCH (o:Openness) RETURN o`, {});
        const records = allOpenness.records;
        if (records.length === 0) return [];
        return records.map(record => new Openness(record.get("o").properties));
    }

    public async findOpennessById(opennessId: string): Promise<Openness | undefined> {
        const openness = await this._neo4jService.read(
            `MATCH (o:Openness) WHERE o.opennessId = $opennessId RETURN o`,
            { opennessId: opennessId }
        );
        if (openness.records.length === 0) return undefined;
        return new Openness(openness.records[0].get("o").properties);
    }

    public async addOpenness(openness: Openness): Promise<Openness> {
        const opennessId = this._neo4jService.generateId();
        await this._neo4jService.tryWriteAsync(
            `
            CREATE (o:Openness {
                opennessId: $opennessId,
                opennessLevel: $opennessLevel,
                opennessDescription: $opennessDescription
            })
        `,
            {
                // Openness
                opennessId: openness.opennessId ?? opennessId,

                opennessLevel: openness.opennessLevel,

                opennessDescription: openness.opennessDescription,
            }
        );

        const addedOpenness = await this.findOpennessById(openness.opennessId ?? opennessId);

        return addedOpenness;
    }

    public async updateOpenness(openness: Openness): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (o:Openness) WHERE o.opennessId = $opennessId
            SET o.opennessLevel = $opennessLevel,
                o.opennessDescription = $opennessDescription
        `,
            {
                // Openness
                opennessId: openness.opennessId,

                opennessLevel: openness.opennessLevel,

                opennessDescription: openness.opennessDescription,
            }
        );
    }

    public async deleteOpenness(opennessId: string): Promise<void> {
        await this._neo4jService.tryWriteAsync(
            `
            MATCH (o:Openness) WHERE o.opennessId = $opennessId
            DETACH DELETE o
        `,
            {
                // Openness
                opennessId: opennessId,
            }
        );
    }
}
