import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Post,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe,
    UseInterceptors,
    UseGuards,
    Req,
} from "@nestjs/common";
import { Post as PostModel } from "../models";
import { IPostsRepository } from "../services/postRepository/posts.repository.inerface";
import { _$ } from "../../_domain/injectableTokens";
import { ApiTags } from "@nestjs/swagger";
import { PostCreationPayloadDto } from "../models/postCreationPayload.dto";
import { AuthGuard } from "@nestjs/passport";
import { AuthedUser } from "../../auth/decorators/authedUser.param.decorator";
import { User } from "../../users/models";
import { IPostsService } from "../services/posts.service.interface";

@ApiTags("posts")
@Controller("posts")
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
    private readonly _postsRepository: IPostsRepository;
    private readonly _postsService: IPostsService;

    constructor(
        @Inject(_$.IPostsRepository) postsRepository: IPostsRepository,
        @Inject(_$.IPostsService) postsService: IPostsService
    ) {
        this._postsRepository = postsRepository;
        this._postsService = postsService;
    }

    @Get()
    public async index(): Promise<PostModel[] | Error> {
        let posts = await this._postsRepository.findAll();
        for (let i = 0; i < posts.length; i++) {
            posts[i] = await posts[i].toJSON();
        }
        return posts;
    }

    @Get(":postId")
    public async getPostById(
        @Param("postId", new ParseUUIDPipe()) postId: string
    ): Promise<PostModel | Error> {
        const post = await this._postsRepository.findPostById(postId);
        if (post === undefined) throw new HttpException("Post not found", 404);
        return await post.toJSON();
    }

    @Post("create")
    @UseGuards(AuthGuard("jwt"))
    public async createPost(
        @Body() postPayload: PostCreationPayloadDto
    ): Promise<PostModel | Error> {
        const post = await this._postsService.authorNewPost(postPayload);
        throw new HttpException("Not implemented", 501);
    }
}
