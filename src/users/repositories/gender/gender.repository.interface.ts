import { Gender } from "../../models";

export interface IGenderRepository {
    findAll(): Promise<Gender[]>;

    findGenderById(genderId: string): Promise<Gender | undefined>;

    addGender(gender: Gender): Promise<Gender>;

    updateGender(gender: Gender): Promise<void>;

    deleteGender(genderId: string): Promise<void>;
}
