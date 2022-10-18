import { Sexuality } from "../../models";

export interface ISexualityRepository {
    findAll(): Promise<Sexuality[]>;

    findSexualityById(sexualityId: string): Promise<Sexuality | undefined>;

    addSexuality(sexuality: Sexuality): Promise<Sexuality>;

    updateSexuality(sexuality: Sexuality): Promise<void>;

    deleteSexuality(sexualityId: string): Promise<void>;
}
