import { PostType } from "../../models";

export interface IPostTypesRepository {
    findAll(): Promise<PostType[]>;

    findPostTypeById(postTypeId: string): Promise<PostType | undefined>;
}
