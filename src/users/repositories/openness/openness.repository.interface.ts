import { Openness } from "../../models";

export interface IOpennessRepository {
    findAll(): Promise<Openness[]>;

    findOpennessById(opennessId: UUID): Promise<Openness | undefined>;

    addOpenness(openness: Openness): Promise<Openness>;

    updateOpenness(openness: Openness): Promise<void>;

    deleteOpenness(opennessId: UUID): Promise<void>;
}
