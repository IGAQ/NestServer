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
    UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthedUser } from "../../auth/decorators/authedUser.param.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { OptionalJwtAuthGuard } from "../../auth/guards/optionalJwtAuth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { ModerationPayloadDto } from "../../moderation/dtos";
import { IModeratorActionsService } from "../../moderation/services/moderatorActions/moderatorActions.service.interface";
import { Role, User } from "../../users/models";
import { _$ } from "../../_domain/injectableTokens";
import { CommentCreationPayloadDto, ReportCommentPayloadDto, VoteCommentPayloadDto } from "../dtos";
import { Comment as CommentModel } from "../models";
import { ICommentsService } from "../services/comments/comments.service.interface";
import { ICommentsReportService } from "../services/commentReport/commentsReport.service.interface";
import { CaptchaGuard } from "../../google-cloud-recaptcha-enterprise/captcha.guard";

@ApiTags("comments")
@Controller("comments")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class CommentsController {
    private readonly _dbContext: DatabaseContext;
    private readonly _commentsService: ICommentsService;
    private readonly _moderatorActionsService: IModeratorActionsService;
    private readonly _commentsReportService: ICommentsReportService;

    constructor(
        @Inject(_$.IDatabaseContext) dbContext: DatabaseContext,
        @Inject(_$.ICommentsService) commentsService: ICommentsService,
        @Inject(_$.IModeratorActionsService) moderatorActionsService: IModeratorActionsService,
        @Inject(_$.ICommentsReportService) commentsReportService: ICommentsReportService
    ) {
        this._dbContext = dbContext;
        this._commentsService = commentsService;
        this._moderatorActionsService = moderatorActionsService;
        this._commentsReportService = commentsReportService;
    }

    @Get()
    @CacheTTL(4)
    @UseGuards(OptionalJwtAuthGuard)
    @UseInterceptors(CacheInterceptor)
    public async index(@AuthedUser() user: User): Promise<CommentModel[]> {
        const comments = await this._dbContext.Comments.findAll();
        const decoratedComments = comments.map(comment =>
            comment.toJSON({ authenticatedUserId: user?.userId ?? undefined })
        );
        return await Promise.all(decoratedComments);
    }

    @Get(":commentId/nestedComments")
    @UseGuards(OptionalJwtAuthGuard)
    public async getNestedComments(
        @AuthedUser() user: User,
        @Param("commentId", new ParseUUIDPipe()) commentId: UUID
    ): Promise<CommentModel[]> {
        const comments = await this._commentsService.findNestedCommentsByCommentId(
            commentId,
            10,
            2,
            3
        );
        const decoratedComments = comments.map(comment =>
            comment.toJSONNested({ authenticatedUserId: user?.userId ?? undefined })
        );
        return await Promise.all(decoratedComments);
    }

    @Get(":commentId")
    @UseGuards(OptionalJwtAuthGuard)
    public async getCommentById(
        @AuthedUser() user: User,
        @Param("commentId", new ParseUUIDPipe()) commentId: UUID
    ): Promise<CommentModel | Error> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (comment === undefined) throw new HttpException("Comment not found", 404);
        return await comment.toJSON({ authenticatedUserId: user?.userId ?? undefined });
    }

    @Post(":commentId/pin")
    @UseGuards(AuthGuard("jwt"))
    public async pinComment(
        @Param("commentId", new ParseUUIDPipe()) commentId: UUID
    ): Promise<void> {
        await this._commentsService.markAsPinned(commentId);
    }

    @Post(":commentId/unpin")
    @UseGuards(AuthGuard("jwt"))
    public async unpinComment(
        @Param("commentId", new ParseUUIDPipe()) commentId: UUID
    ): Promise<void> {
        await this._commentsService.markAsUnpinned(commentId);
    }

    @Post("create")
    // @UseGuards(CaptchaGuard)
    @UseGuards(AuthGuard("jwt"))
    public async createComment(
        @Body() commentPayload: CommentCreationPayloadDto
    ): Promise<CommentModel> {
        const comment = await this._commentsService.authorNewComment(commentPayload);
        return await comment.toJSON();
    }

    @Delete("/")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async deleteComment(
        @AuthedUser() user: User,
        @Body() moderationPayload: ModerationPayloadDto
    ): Promise<void> {
        moderationPayload.moderatorId = user.userId;
        await this._moderatorActionsService.deleteComment(moderationPayload);
    }

    @Post("/vote")
    @UseGuards(AuthGuard("jwt"))
    public async voteComment(@Body() voteCommentPayload: VoteCommentPayloadDto): Promise<void> {
        await this._commentsService.voteComment(voteCommentPayload);
    }

    @Post("/report")
    @UseGuards(AuthGuard("jwt"))
    public async reportComment(
        @Body() reportCommentPayload: ReportCommentPayloadDto
    ): Promise<void> {
        await this._commentsReportService.reportComment(reportCommentPayload);
    }
}
