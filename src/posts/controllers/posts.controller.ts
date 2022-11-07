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
    UseGuards,
    UseInterceptors,
    CacheInterceptor,
    CacheTTL,
} from "@nestjs/common";
import { Post as PostModel } from "../models";
import { _$ } from "../../_domain/injectableTokens";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PostCreationPayloadDto } from "../models/postCreationPayload.dto";
import { AuthGuard } from "@nestjs/passport";
import { IPostsService } from "../services/posts.service.interface";
import { DatabaseContext } from "../../database-access-layer/databaseContext";

@ApiTags("posts")
@Controller("posts")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
    private readonly _dbContext: DatabaseContext;
    private readonly _postsService: IPostsService;

    constructor(
        @Inject(_$.IDatabaseContext) dbContext: DatabaseContext,
        @Inject(_$.IPostsService) postsService: IPostsService
    ) {
        this._dbContext = dbContext;
        this._postsService = postsService;
    }

    @Get()
    @CacheTTL(10)
    @UseInterceptors(CacheInterceptor)
    public async index(): Promise<PostModel[] | Error> {
        const posts = await this._dbContext.Posts.findAll();
        const decoratedPosts = posts.map(async post => post.toJSON());
        return await Promise.all(decoratedPosts);
    }

    @Get(":postId")
    public async getPostById(
        @Param("postId", new ParseUUIDPipe()) postId: string
    ): Promise<PostModel | Error> {
        const post = await this._dbContext.Posts.findPostById(postId);
        if (post === undefined) throw new HttpException("Post not found", 404);
        return await post.toJSON();
    }

    @Post("create")
    @UseGuards(AuthGuard("jwt"))
    public async createPost(
        @Body() postPayload: PostCreationPayloadDto
    ): Promise<PostModel | Error> {
        const post = await this._postsService.authorNewPost(postPayload);
        return await post.toJSON();
    }
}
