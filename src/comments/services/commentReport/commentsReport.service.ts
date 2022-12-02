import { ReportCommentPayloadDto } from "../../dtos";
import { User } from "../../../users/models";
import { HttpException, Inject, Injectable, Logger, Scope } from "@nestjs/common";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { _$ } from "../../../_domain/injectableTokens";
import { ReportedProps, UserToCommentRelTypes } from "../../../users/models/toComment";
import { ICommentsReportService } from "./commentsReport.service.interface";

@Injectable({ scope: Scope.REQUEST })
export class CommentsReportService implements ICommentsReportService {
    private readonly _logger = new Logger(CommentsReportService.name);
    private readonly _request: Request;
    private readonly _dbContext: DatabaseContext;

    constructor(
        @Inject(REQUEST) request: Request,
        @Inject(_$.IDatabaseContext) databaseContext: DatabaseContext
    ) {
        this._request = request;
        this._dbContext = databaseContext;
    }

    public async reportComment(reportCommentPayload: ReportCommentPayloadDto): Promise<void> {
        const user = this.getUserFromRequest();

        const comment = await this._dbContext.Comments.findCommentById(
            reportCommentPayload.commentId
        );
        if (!comment) throw new Error("Comment not found");

        if (comment.pending || comment.restrictedProps !== null) {
            throw new HttpException(
                "Comment cannot be reported due to being pending or restricted",
                400
            );
        }

        const report = await this.checkIfUserReportedComment(comment.commentId, user.userId);

        if (report === true) {
            throw new HttpException("You have already reported this post", 400);
        }

        await comment.getAuthorUser();
        if (comment.authorUser.userId === user.userId) {
            throw new HttpException("Comment cannot be reported by comment author", 400);
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
			MATCH (c:Comment { commentId: $commentId }), (u:User { userId: $userId })
				MERGE (u)-[r:${UserToCommentRelTypes.REPORTED}{reportedAt: $reportedAt, reason: $reason}]->(c)
			`,
            {
                reportedAt: Date.now(),
                reason: reportCommentPayload.reason,
                commentId: comment.commentId,
                userId: user.userId,
            }
        );
    }

    public async getReportsForComment(commentId: UUID): Promise<ReportedProps[]> {
        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
			MATCH (c:Comment { commentId: $commentId })<-[r:${UserToCommentRelTypes.REPORTED}]-(u:User)
            RETURN r, u`,
            {
                commentId: commentId,
            }
        );
        return queryResult.records.map(record => {
            const reportedProps = new ReportedProps(record.get("r").properties);
            return reportedProps;
        });
    }

    private async checkIfUserReportedComment(commentId: UUID, userId: UUID): Promise<boolean> {
        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (p:Comment { commentId: $commentId })<-[r:${UserToCommentRelTypes.REPORTED}]-(u:User { userId: $userId })
            RETURN r
            `,
            {
                commentId: commentId,
                userId: userId,
            }
        );
        if (queryResult.records.length > 0) {
            return true;
        }
        return false;
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new Error("User not found");
        return user;
    }
}
