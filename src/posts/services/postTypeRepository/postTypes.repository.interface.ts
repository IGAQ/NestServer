import { PostType } from "../../models";

export interface IPostTypesRepository {
    findAll(): Promise<PostType[]>;

    findPostTypeById(postTypeId: string): Promise<PostType | undefined>;

    findPostTypeByName(postTypeName: string): Promise<PostType | undefined>;
}
