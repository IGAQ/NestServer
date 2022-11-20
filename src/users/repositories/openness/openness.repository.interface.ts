import { Openness } from "../../models";

export interface IOpennessRepository {
    findAll(): Promise<Openness[]>;

    findOpennessById(opennessId: string): Promise<Openness | undefined>;

    addOpenness(openness: Openness): Promise<Openness>;

    updateOpenness(openness: Openness): Promise<void>;

    deleteOpenness(opennessId: string): Promise<void>;
}
