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

        const reports = await this.getReportsForComment(comment.commentId);

        if (reports.some(r => r.userId === user.userId)) {
            throw new HttpException("Comment already reported", 400);
        }

        await comment.getAuthorUser();
        if (comment.authorUser.userId === user.userId) {
            throw new HttpException("Comment cannot be reported by comment author", 400);
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
			MATCH (c:Comment { commentId: $commentId }), (u:User { userId: $userId })
				MERGE (u)-[r:${UserToCommentRelTypes.REPORTED}]->(c)
			`,
            {
                commentId: comment.commentId,
                userId: user.userId,
            }
        );
    }

    public async getReportsForComment(commentId: UUID): Promise<ReportedProps[]> {
        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
			MATHC (c:Comment { commentId: $commentId })<-[r:${UserToCommentRelTypes.REPORTED}]-(u:User)`,
            {
                commentId: commentId,
            }
        );
        return queryResult.records.map(record => {
            const reportedProps = new ReportedProps(record.get("r").properties);
            reportedProps.userId = record.get("u").properties.userId;
            return reportedProps;
        });
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new Error("User not found");
        return user;
    }
}
