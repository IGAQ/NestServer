import { Award } from "../../models";

export interface IPostAwardRepository {
    findAll(): Promise<Award[]>;

    findAwardById(awardId: string): Promise<Award | undefined>;

    addAward(award: Award): Promise<Award>;

    updateAward(award: Award): Promise<void>;

    deleteAward(awardId: string): Promise<void>;
}

