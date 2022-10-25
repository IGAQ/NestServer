import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Put,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe,
    Post,
    Req,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { _$ } from "../../_domain/injectableTokens";
import { PostTag } from "../models";
import { IPostTagsRepository } from "../services/postTagRepository/postTags.repository.interface";

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
        let postTags = await this._postTagsRepository.findAll();
        return postTags;
    }

    @Get(":tagId")
    public async getPostTagByTagId(
        @Param("tagId", new ParseUUIDPipe()) tagId: string
    ): Promise<PostTag | Error> {
        const postTag = await this._postTagsRepository.getPostTagByTagId(tagId);
        if (postTag === undefined) throw new HttpException("PostTag not found", 404);
        return postTag;
    }

    // @Post("create")
    // @UseGuards(AuthGuard("jwt"))
    // public async addPostTag(@Body() postTag: PostTag): Promise<PostTag | Error> {
    //     const createdPostTag = await this._postTagsRepository.addPostTag(postTag);
    //     return createdPostTag;
    // }

    // @Put(":tagId")
    // @UseGuards(AuthGuard("jwt"))
    // public async updatePostTag(@Body() postTag: PostTag): Promise<void | Error> {
    //     await this._postTagsRepository.updatePostTag(postTag);
    // }

    // @Delete(":tagId")
    // public async deletePostTag(
    //     @Param("tagId", new ParseUUIDPipe()) tagId: string
    // ): Promise<void | Error> {
    //     await this._postTagsRepository.deletePostTag(tagId);
    // }
}

