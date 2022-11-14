import { PostType } from "../../models";

export interface IPostTypesRepository {
    findAll(): Promise<PostType[]>;

    findPostTypeByName(postTypeName: string): Promise<PostType | undefined>;
}
