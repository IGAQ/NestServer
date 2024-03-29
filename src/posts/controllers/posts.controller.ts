import {
    Body,
    CacheInterceptor,
    CacheTTL,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthedUser } from "../../auth/decorators/authedUser.param.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { OptionalJwtAuthGuard } from "../../auth/guards/optionalJwtAuth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Comment } from "../../comments/models";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { ModerationPayloadDto } from "../../moderation/dtos/moderatorActions";
import { IModeratorActionsService } from "../../moderation/services/moderatorActions/moderatorActions.service.interface";
import { Role, User } from "../../users/models";
import { _$ } from "../../_domain/injectableTokens";
import { PostCreationPayloadDto, ReportPostPayloadDto, VotePostPayloadDto } from "../dtos";
import { Post as PostModel } from "../models";
import { IPostsService } from "../services/posts/posts.service.interface";
import { IPostsReportService } from "../services/postReport/postsReport.service.interface";
import { CaptchaGuard } from "../../google-cloud-recaptcha-enterprise/captcha.guard";

@ApiTags("posts")
@Controller("posts")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
    private readonly _dbContext: DatabaseContext;
    private readonly _postsService: IPostsService;
    private readonly _moderationActionsService: IModeratorActionsService;
    private readonly _postsReportService: IPostsReportService;

    constructor(
        @Inject(_$.IDatabaseContext) dbContext: DatabaseContext,
        @Inject(_$.IPostsService) postsService: IPostsService,
        @Inject(_$.IModeratorActionsService) moderationActionsService: IModeratorActionsService,
        @Inject(_$.IPostsReportService) postsReportService: IPostsReportService
    ) {
        this._dbContext = dbContext;
        this._postsService = postsService;
        this._moderationActionsService = moderationActionsService;
        this._postsReportService = postsReportService;
    }

    @Get()
    @Roles(Role.MODERATOR)
    @UseGuards(OptionalJwtAuthGuard, RolesGuard)
    @CacheTTL(5)
    @UseInterceptors(CacheInterceptor)
    public async index(@AuthedUser() user: User): Promise<PostModel[]> {
        const posts = await this._dbContext.Posts.findAll();
        const decoratedPosts = posts.map(post =>
            post.toJSON({ authenticatedUserId: user?.userId ?? undefined })
        );
        return await Promise.all(decoratedPosts);
    }

    @Get("/queery/ofTheDay")
    @UseGuards(OptionalJwtAuthGuard)
    @CacheTTL(3600 * 24)
    @UseInterceptors(CacheInterceptor)
    public async getQueeriesOfTheDay(): Promise<PostModel[]> {
        return await this._postsService.getQueeriesOfTheDay();
    }

    @Get("/story/ofTheDay")
    @UseGuards(OptionalJwtAuthGuard)
    @CacheTTL(3600 * 24)
    @UseInterceptors(CacheInterceptor)
    public async getStoriesOfTheDay(): Promise<PostModel[]> {
        return await this._postsService.getStoriesOfTheDay();
    }

    @Get("/queery")
    @UseGuards(OptionalJwtAuthGuard)
    @CacheTTL(10)
    @UseInterceptors(CacheInterceptor)
    public async getAllQueeries(@AuthedUser() user: User): Promise<PostModel[]> {
        const queeries = await this._postsService.findAllQueeries();
        const decoratedQueeries = queeries.map(queery =>
            queery.toJSON({ authenticatedUserId: user?.userId ?? undefined })
        );
        return await Promise.all(decoratedQueeries);
    }

    @Get("/story")
    @UseGuards(OptionalJwtAuthGuard)
    @CacheTTL(10)
    @UseInterceptors(CacheInterceptor)
    public async getAllStories(@AuthedUser() user: User): Promise<PostModel[]> {
        const stories = await this._postsService.findAllStories();
        const decoratedStories = stories.map(story =>
            story.toJSON({ authenticatedUserId: user?.userId ?? undefined })
        );
        return await Promise.all(decoratedStories);
    }

    @Get("/:postId/nestedComments")
    @UseGuards(OptionalJwtAuthGuard)
    public async getNestedCommentsByPostId(
        @AuthedUser() user: User,
        @Param("postId", new ParseUUIDPipe()) postId: UUID
    ): Promise<Comment[]> {
        const topLevelComments = await this._postsService.findNestedCommentsByPostId(
            postId,
            10,
            2,
            2
        );
        const decoratedTopLevelComments = topLevelComments.map(comment =>
            comment.toJSONNested({ authenticatedUserId: user?.userId ?? undefined })
        );
        return await Promise.all(decoratedTopLevelComments);
    }

    @Get("/:postId")
    @CacheTTL(10)
    @UseGuards(OptionalJwtAuthGuard)
    public async getPostById(
        @AuthedUser() user: User,
        @Param("postId", new ParseUUIDPipe()) postId: UUID
    ): Promise<PostModel> {
        const post = await this._postsService.findPostById(postId);
        return await post.toJSON({ authenticatedUserId: user?.userId ?? undefined });
    }

    @Get("/user/:userId")
    @CacheTTL(20)
    @UseGuards(AuthGuard("jwt"))
    public async getPostsByUserId(
        @AuthedUser() user: User,
        @Param("userId", new ParseUUIDPipe()) userId: UUID
    ): Promise<PostModel[]> {
        const posts = await this._postsService.findPostsByUserId(userId);
        const decoratedPosts = posts.map(post =>
            post.toJSON({ authenticatedUserId: user?.userId ?? undefined })
        );
        return await Promise.all(decoratedPosts);
    }

    @Post("/create")
    // @UseGuards(CaptchaGuard)
    @UseGuards(AuthGuard("jwt"))
    public async createPost(@Body() postPayload: PostCreationPayloadDto): Promise<PostModel> {
        const post = await this._postsService.authorNewPost(postPayload);
        return await post.toJSON();
    }

    @Delete("/")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async deletePost(
        @AuthedUser() user: User,
        @Body() deletePostPayload: ModerationPayloadDto
    ): Promise<void> {
        deletePostPayload.moderatorId = user.userId;
        await this._moderationActionsService.deletePost(deletePostPayload);
    }

    @Post("/vote")
    @UseGuards(AuthGuard("jwt"))
    public async votePost(@Body() votePostPayload: VotePostPayloadDto): Promise<void> {
        await this._postsService.votePost(votePostPayload);
        return;
    }

    @Post("/report")
    // @UseGuards(CaptchaGuard)
    @UseGuards(AuthGuard("jwt"))
    public async reportPost(@Body() reportPostPayload: ReportPostPayloadDto): Promise<void> {
        await this._postsReportService.reportPost(reportPostPayload);
    }
}
