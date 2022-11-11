import {
    Body, CacheInterceptor,
    CacheTTL, ClassSerializerInterceptor,
    Controller,
    Get, HttpException,
    Inject,
    Param,
    ParseUUIDPipe, Post, UseGuards,
    UseInterceptors
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { _$ } from "../../_domain/injectableTokens";
import { Comment as CommentModel } from "../models";
import { CommentCreationPayloadDto } from "../models/commentCreationPayload.dto";
import { ICommentsService } from "../services/comments.service.interface";

@ApiTags("comments")
@Controller('comments')
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
    @CacheTTL(10) // idk how many to cache this needs to change
    @UseInterceptors(CacheInterceptor)
    public async index(): Promise<CommentModel[] | Error> {
        const comments = await this._dbContext.Comments.findAll();
        const decoratedComments = comments.map(comment => comment.toJSON());
        return await Promise.all(decoratedComments);
    }

    @Get(":commentId")
    public async getCommentById(
        @Param("commentId", new ParseUUIDPipe()) commentId: string
    ): Promise<CommentModel | Error> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (comment === undefined) throw new HttpException("Comment not found", 404);
        return await comment.toJSON();
    }

    @Post("create")
    @UseGuards(AuthGuard("jwt"))
    public async createComment(
        @Body() commentPayload: CommentCreationPayloadDto
    ): Promise<CommentModel | Error> {
        const comment = await this._commentsService.authorNewComment(commentPayload);
        return await comment.toJSON();
    }
}
