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
    UseInterceptors
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { _$ } from "../../_domain/injectableTokens";
import { Comment as CommentModel } from "../models";
import { CommentCreationPayloadDto, VoteCommentPayloadDto } from "../dtos";
import { ICommentsService } from "../services/comments/comments.service.interface";
import { OptionalJwtAuthGuard } from "../../auth/guards/optionalJwtAuth.guard";
import { AuthedUser } from "../../auth/decorators/authedUser.param.decorator";
import { User } from "../../users/models";

@ApiTags("comments")
@Controller("comments")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class CommentsController {
    private readonly _dbContext: DatabaseContext;
    private readonly _commentsService: ICommentsService;

    constructor(
        @Inject(_$.IDatabaseContext) dbContext: DatabaseContext,
        @Inject(_$.ICommentsService) commentsService: ICommentsService
    ) {
        this._dbContext = dbContext;
        this._commentsService = commentsService;
    }

    @Get()
    @CacheTTL(4)
    @UseGuards(OptionalJwtAuthGuard)
    @UseInterceptors(CacheInterceptor)
    public async index(@AuthedUser() user: User): Promise<CommentModel[] | Error> {
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
        @Param("commentId", new ParseUUIDPipe()) commentId: string
    ): Promise<CommentModel[] | Error> {
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
        @Param("commentId", new ParseUUIDPipe()) commentId: string
    ): Promise<CommentModel | Error> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (comment === undefined) throw new HttpException("Comment not found", 404);
        return await comment.toJSON({ authenticatedUserId: user?.userId ?? undefined });
    }

    // pin comment 
    @Post(":commentId/pin")
    @UseGuards(AuthGuard("jwt"))
    public async pinComment(@Param("commentId", new ParseUUIDPipe()) commentId: string): Promise<void> {
        await this._commentsService.markAsPinned(commentId);
    }

    @Post("create")
    @UseGuards(AuthGuard("jwt"))
    public async createComment(
        @Body() commentPayload: CommentCreationPayloadDto
    ): Promise<CommentModel | Error> {
        const comment = await this._commentsService.authorNewComment(commentPayload);
        return await comment.toJSON();
    }

    @Post("vote")
    @UseGuards(AuthGuard("jwt"))
    public async voteComment(
        @Body() voteCommentPayload: VoteCommentPayloadDto
    ): Promise<void | Error> {
        await this._commentsService.voteComment(voteCommentPayload);
        return;
    }
}
