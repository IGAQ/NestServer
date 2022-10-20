import { IPostTypesRepository } from "./postTypes.repository.interface";
import { PostType } from "../../models";

export class PostTypesRepository implements IPostTypesRepository {
    public async findAll(): Promise<PostType[]> {
        throw new Error("Method not implemented.");
    }

    public async findPostTypeById(postTypeId: string): Promise<PostType | undefined> {
        throw new Error("Method not implemented.");
    }
}
