import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe,
    UseInterceptors,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { _$ } from "../../_domain/injectableTokens";
import { PostTag } from "../models";
import { IPostTagsRepository } from "../repositories/postTag/postTags.repository.interface";

@ApiTags("postTags")
@Controller("postTags")
@UseInterceptors(ClassSerializerInterceptor)
export class PostTagsController {
    private readonly _postTagsRepository: IPostTagsRepository;

    constructor(@Inject(_$.IPostTagsRepository) postTagsRepository: IPostTagsRepository) {
        this._postTagsRepository = postTagsRepository;
    }

    @Get()
    public async index(): Promise<PostTag[] | Error> {
        return await this._postTagsRepository.findAll();
    }

    @Get("/name/:tagName")
    public async getPostTagByTagName(@Param("tagName") tagName: string) {
        const postTag = await this._postTagsRepository.findPostTagByName(tagName);
        if (postTag === undefined) throw new HttpException("PostTag not found", 404);
        return postTag;
    }

    // @Post("create")
    // @UseGuards(AuthGuard("jwt"))
    // public async addPostTag(@Body() postTag: PostTag): Promise<PostTag | Error> {
    //     const createdPostTag = await this._postTagsRepository.addPostTag(postTag);
    //     return createdPostTag;
    // }

    // @Put(":tagName")
    // @UseGuards(AuthGuard("jwt"))
    // public async updatePostTag(@Body() postTag: PostTag): Promise<void | Error> {
    //     await this._postTagsRepository.updatePostTag(postTag);
    // }

    // @Delete(":tagName")
    // public async deletePostTag(
    //     @Param("tagName") tagName: string
    // ): Promise<void | Error> {
    //     await this._postTagsRepository.deletePostTag(tagName);
    // }
}
