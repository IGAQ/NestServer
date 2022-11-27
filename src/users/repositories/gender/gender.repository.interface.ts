import { Gender } from "../../models";

export interface IGenderRepository {
    findAll(): Promise<Gender[]>;

    findGenderById(genderId: UUID): Promise<Gender | undefined>;

    addGender(gender: Gender): Promise<Gender>;

    updateGender(gender: Gender): Promise<void>;

    deleteGender(genderId: UUID): Promise<void>;
}
