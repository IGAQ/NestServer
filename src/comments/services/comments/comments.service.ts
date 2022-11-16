import { HttpService } from "@nestjs/axios";
import { HttpException, Inject, Injectable, Logger, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { catchError, lastValueFrom, map, throwError } from "rxjs";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { Post } from "../../../posts/models";
import { PostToCommentRelTypes } from "../../../posts/models/toComment";
import { User } from "../../../users/models";
import { UserToCommentRelTypes } from "../../../users/models/toComment";
import { WasOffendingProps } from "../../../users/models/toSelf";
import { _$ } from "../../../_domain/injectableTokens";
import {
    CommentCreationPayloadDto,
    HateSpeechRequestPayloadDto,
    HateSpeechResponseDto,
    VoteCommentPayloadDto,
    VoteType
} from "../../dtos";
import { Comment } from "../../models";
import { CommentToSelfRelTypes, DeletedProps, RepliedProps } from "../../models/toSelf";
import { ICommentsService } from "./comments.service.interface";
@Injectable({ scope: Scope.REQUEST })
export class CommentsService implements ICommentsService {
    private readonly _logger = new Logger(CommentsService.name);
    private readonly _request: Request;
    private readonly _dbContext: DatabaseContext;
    private readonly _httpService: HttpService;
    private readonly _configService: ConfigService;

    constructor(
        @Inject(REQUEST) request: Request,
        @Inject(_$.IDatabaseContext) databaseContext: DatabaseContext,
        httpService: HttpService,
        configService: ConfigService
    ) {
        this._request = request;
        this._dbContext = databaseContext;
        this._httpService = httpService;
        this._configService = configService;
    }

    public async authorNewComment(commentPayload: CommentCreationPayloadDto): Promise<Comment> {
        const user = this.getUserFromRequest();

        // auto-moderation
        const autoModerationApiKey = this._configService.get<string>("MODERATE_HATESPEECH_API_KEY");
        const autoModerationApiUrl = this._configService.get<string>("MODERATE_HATESPEECH_API_URL");

        const hateSpeechResponseDto = await lastValueFrom(
            this._httpService
                .post<HateSpeechResponseDto>(
                    autoModerationApiUrl,
                    new HateSpeechRequestPayloadDto({
                        token: autoModerationApiKey,
                        text: commentPayload.commentContent,
                    })
                )
                .pipe(
                    map(response => response.data),
                    catchError(err => {
                        this._logger.error(err);
                        return throwError(() => err);
                    })
                )
        );

        // if moderation failed, throw error
        if (hateSpeechResponseDto.class === "flag") {
            if (hateSpeechResponseDto.confidence >= 0.8) {
                // TODO: create a ticket for the admin to review

                await user.addWasOffendingRecord(
                    new WasOffendingProps({
                        timestamp: new Date().getTime(),
                        userContent: commentPayload.commentContent,
                        autoModConfidenceLevel: hateSpeechResponseDto.confidence,
                    })
                );
                throw new HttpException("Hate speech detected", 400);
            }
        }

        // get all records of them offending. And, get all comments that this user authored.
        const userOffendingRecords = await user.getWasOffendingRecords();
        const userAuthoredComments = await user.getAuthoredComments();

        // lazy-query the restriction state of the comments.
        for (const i in userAuthoredComments) {
            await userAuthoredComments[i].getRestricted();
        }

        // calculate the honour level of the user. (0 < honourLevel < 1)
        const numberOfCleanComments = userAuthoredComments.map(
            c => !c.pending && c.restrictedProps === null
        ).length;

        const honourGainHardshipCoefficient = 0.1; // 0.1 means: for the user to achieve the full level of honour, they need at least 10 clean comments while not having any offending records.

        let honourLevel =
            (1 + numberOfCleanComments * honourGainHardshipCoefficient) /
            (2 + userOffendingRecords.length);
        honourLevel = honourLevel > 1 ? 1 : honourLevel;

        // if moderation passed, create comment and return it.
        return await this._dbContext.Comments.addComment(
            new Comment({
                commentContent: commentPayload.commentContent,
                authorUser: user,
                pending: honourLevel < 0.4, // the comment will not be in the pending state only if user's honour level is higher than 0.4
            })
        );
    }

    public async findCommentById(commentId: string): Promise<Comment> {
        const foundComment = await this._dbContext.Comments.findCommentById(commentId);
        if (!foundComment) {
            throw new HttpException("Comment not found", 404);
        }
        if (foundComment.pending) {
            throw new HttpException(
                "Comment cannot be shown publicly due to striking policies",
                403
            );
        }
        await foundComment.getDeletedProps();
        if (foundComment.deletedProps) {
            throw new HttpException("Comment was deleted", 404);
        }
        await foundComment.getRestricted();
        if (foundComment.restrictedProps) {
            throw new HttpException("Comment is restricted", 404);
        }

        return await foundComment.toJSON();
    }

    public async voteComment(voteCommentPayload: VoteCommentPayloadDto): Promise<void> {
        const user = this.getUserFromRequest();

        const comment = await this._dbContext.Comments.findCommentById(
            voteCommentPayload.commentId
        );
        if (!comment) throw new HttpException("Comment not found", 404);

        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId })-[r:${UserToCommentRelTypes.UPVOTES}|${UserToCommentRelTypes.DOWN_VOTES}]->(c:Comment { commentId: $commentId })
            `,
            {
                userId: user.userId,
                commentId: voteCommentPayload.commentId,
            }
        );

        if (queryResult.records.length > 0) {
            const relType = queryResult.records[0].get("r").type;
            if (
                relType === UserToCommentRelTypes.UPVOTES &&
                voteCommentPayload.voteType === VoteType.UPVOTES
            ) {
                throw new HttpException("User already upvoted this comment", 400);
            } else if (
                relType === UserToCommentRelTypes.DOWN_VOTES &&
                voteCommentPayload.voteType === VoteType.DOWN_VOTES
            ) {
                throw new HttpException("User already downvoted this comment", 400);
            } else {
                await this._dbContext.neo4jService.tryWriteAsync(
                    `
                    MATCH (u:User { userId: $userId })-[r:${relType}]->(c:Comment { commentId: $commentId })
                    DELETE r
                    `,
                    {
                        userId: user.userId,
                        commentId: voteCommentPayload.commentId,
                    }
                );
            }
        }
    }

    public async markAsPinned(commentId: string): Promise<void> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (!comment) throw new HttpException("Comment not found", 404);

        const user = this.getUserFromRequest();

        const parentPost = await this.findParentPost(commentId);

        if (parentPost.authorUser.userId !== user.userId) {
            throw new HttpException("User is not the author of the post", 403);
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (c:Comment { commentId: $commentId })
            SET c.pinned = true
            `,
            {
                commentId,
            }
        );
    }

    public async markAsDeleted(commentId: string): Promise<void> {
        const comment = await this._dbContext.Comments.findCommentById(commentId);
        if (!comment) {
            throw new HttpException("Comment not found", 404);
        }

        await comment.getDeletedProps();
        if (comment.deletedProps) {
            throw new HttpException("Comment was already deleted", 400);
        }

        await comment.getAuthorUser();

        await comment.setDeletedProps(
            new DeletedProps({
                deletedAt: new Date().getTime(),
                deletedByUserId: comment.authorUser.userId,
            })
        );
    }


    // gets the parent post of any nested comment of the post
    private async findParentPost(commentId: string): Promise<Post> {
        async function findParentComment(commentId: string): Promise<Comment> {
            const queryResult = await this._dbContext.neo4jService.tryReadAsync(
                ` 
                MATCH (c:Comment { commentId: $commentId })-[:${CommentToSelfRelTypes.REPLIED}]->(c:Comment))
                 RETURN c
                 `,
                {
                    commentId,
                }
            );
            if (queryResult.records.length > 0) {
                findParentComment(queryResult.records[0].get("c").properties.commentId);
            } else {
                return await this._dbContext.Comments.findCommentById(commentId);
            }
        }

        const parentCommentId = await findParentComment(commentId);

        const parentPost = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (p:Post)-[:${PostToCommentRelTypes.HAS_COMMENT}]->(c:Comment { commentId: $commentId })
            RETURN p
            `,
            {
                parentCommentId,
            }
        );
        return parentPost.records[0].get("p")
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new Error("User not found");
        return user;
    }

}
