import {
    Body,
    CacheInterceptor,
    CacheTTL,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
    UseInterceptors
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
import { PostCreationPayloadDto, VotePostPayloadDto } from "../dtos";
import { Post as PostModel } from "../models";
import { IPostsService } from "../services/posts/posts.service.interface";

@ApiTags("posts")
@Controller("posts")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
    private readonly _dbContext: DatabaseContext;
    private readonly _postsService: IPostsService;
    private readonly _moderationActionsService: IModeratorActionsService;

    constructor(
        @Inject(_$.IDatabaseContext) dbContext: DatabaseContext,
        @Inject(_$.IPostsService) postsService: IPostsService,
        @Inject(_$.IModeratorActionsService) moderationActionsService: IModeratorActionsService
    ) {
        this._dbContext = dbContext;
        this._postsService = postsService;
        this._moderationActionsService = moderationActionsService;
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

    @Get("/queery")
    @UseGuards(OptionalJwtAuthGuard)
    @CacheTTL(5)
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
    @CacheTTL(5)
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
    @UseGuards(OptionalJwtAuthGuard)
    public async getPostById(
        @AuthedUser() user: User,
        @Param("postId", new ParseUUIDPipe()) postId: UUID
    ): Promise<PostModel> {
        const post = await this._postsService.findPostById(postId);
        return await post.toJSON({ authenticatedUserId: user?.userId ?? undefined });
    }

    @Post("/create")
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
    @UseGuards(AuthGuard("jwt"))
    public async reportPost(
        @AuthedUser() user: User,
        @Body() reportPayload: ModerationPayloadDto
    ): Promise<void> {
        reportPayload.moderatorId = user.userId;
        throw new Error("Not implemented");
    }

    @Post("/allow/:postId")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async allowPost(@Param("postId", new ParseUUIDPipe()) postId: UUID): Promise<void> {
        await this._moderationActionsService.allowPost(postId);
        throw new Error("Not implemented");
    }

    @Get(":postId/checkForPin")
    public async checkForPin(@Param("postId", new ParseUUIDPipe()) postId: UUID): Promise<Comment | null> {
        return await this._postsService.checkForPinnedComment(postId);
    }
}
