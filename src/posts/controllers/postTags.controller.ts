import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
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
}
