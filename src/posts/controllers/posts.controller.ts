import {
    Body,
    CacheInterceptor,
    CacheTTL,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { _$ } from "../../_domain/injectableTokens";
import { Post as PostModel } from "../models";
import { Comment } from "../../comments/models";
import { PostCreationPayloadDto, VotePostPayloadDto } from "../dtos";
import { IPostsService } from "../services/posts/posts.service.interface";

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
        const decoratedPosts = posts.map(post => post.toJSON());
        return await Promise.all(decoratedPosts);
    }

    @Get("/queery")
    @CacheTTL(10)
    @UseInterceptors(CacheInterceptor)
    public async getAllQueeries(): Promise<PostModel[] | Error> {
        const queeries = await this._postsService.findAllQueeries(
            (postA, postB) => postB.createdAt - postA.createdAt
        );
        const decoratedQueeries = queeries.map(queery => queery.toJSON());
        return await Promise.all(decoratedQueeries);
    }

    @Get("/story")
    @CacheTTL(10)
    @UseInterceptors(CacheInterceptor)
    public async getAllStories(): Promise<PostModel[] | Error> {
        const stories = await this._postsService.findAllStories(
            (postA, postB) => postB.createdAt - postA.createdAt
        );
        const decoratedStories = stories.map(story => story.toJSON());
        return await Promise.all(decoratedStories);
    }

    @Get(":postId/nestedComments")
    public async getNestedCommentsByPostId(
        @Param("postId", new ParseUUIDPipe()) postId: string
    ): Promise<Comment[] | Error> {
        const topLevelComments = await this._postsService.findNestedCommentsByPostId(
            postId,
            10,
            2,
            2
        );
        const decoratedTopLevelComments = topLevelComments.map(comment => comment.toJSONNested());
        return await Promise.all(decoratedTopLevelComments);
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

    @Post("vote")
    @UseGuards(AuthGuard("jwt"))
    public async votePost(@Body() votePostPayload: VotePostPayloadDto): Promise<void | Error> {
        await this._postsService.votePost(votePostPayload);
        return;
    }
}
