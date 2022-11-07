import { ApiTags } from "@nestjs/swagger";
import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    UseInterceptors,
} from "@nestjs/common";
import { _$ } from "../../_domain/injectableTokens";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { PostType } from "../models";

@ApiTags("postTypes")
@Controller("postTypes")
@UseInterceptors(ClassSerializerInterceptor)
export class PostTypesController {
    private readonly _dbContext: DatabaseContext;

    constructor(@Inject(_$.IDatabaseContext) dbContext: DatabaseContext) {
        this._dbContext = dbContext;
    }

    @Get()
    public async index(): Promise<PostType[] | Error> {
        return await this._dbContext.PostTypes.findAll();
    }

    @Get(":postTypeName")
    public async getPostTypeByName(@Param("postTypeName") postTypeName: string) {
        const postType = await this._dbContext.PostTypes.findPostTypeByName(postTypeName);
        if (postType === undefined) throw new HttpException("PostType not found", 404);
        return postType;
    }
}
