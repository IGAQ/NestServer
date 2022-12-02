import { ReportPostPayloadDto } from "../../dtos";
import { User } from "../../../users/models";
import { HttpException, Inject, Injectable, Logger, Scope } from "@nestjs/common";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { _$ } from "../../../_domain/injectableTokens";
import { ReportedProps, UserToPostRelTypes } from "../../../users/models/toPost";
import { IPostsReportService } from "./postsReport.service.interface";

@Injectable({ scope: Scope.REQUEST })
export class PostsReportService implements IPostsReportService {
    private readonly _logger = new Logger(PostsReportService.name);
    private readonly _request: Request;
    private readonly _dbContext: DatabaseContext;

    constructor(
        @Inject(REQUEST) request: Request,
        @Inject(_$.IDatabaseContext) databaseContext: DatabaseContext
    ) {
        this._request = request;
        this._dbContext = databaseContext;
    }

    public async reportPost(reportPostPayload: ReportPostPayloadDto): Promise<void> {
        const user = this.getUserFromRequest();
        const post = await this._dbContext.Posts.findPostById(reportPostPayload.postId);
        if (!post) throw new HttpException("Post not found", 404);

        if (post.pending || post.restrictedProps !== null) {
            throw new HttpException(
                "Post cannot be reported due to being pending or restricted",
                400
            );
        }

        const report = await this.checkIfUserReportedPost(post.postId, user.userId);

        if (report === true) {
            throw new HttpException("You have already reported this post", 400);
        }

        await post.getAuthorUser();
        if (post.authorUser.userId === user.userId) {
            throw new HttpException("Post cannot be reported by post author", 400);
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
			MATCH (p:Post { postId: $postId }), (u:User { userId: $userId })
				MERGE (u)-[r:${UserToPostRelTypes.REPORTED}{reportedAt: $reportedAt, reason: $reason}]->(p)
			`,
            {
                reportedAt: Date.now(),
                reason: reportPostPayload.reason,
                postId: post.postId,
                userId: user.userId,
            }
        );
    }

    public async getReportsForPost(postId: UUID): Promise<ReportedProps[]> {
        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
			MATCH (p:Post { postId: $postId })<-[r:${UserToPostRelTypes.REPORTED}]-(u:User)
            RETURN r, u`,
            {
                postId: postId,
            }
        );
        return queryResult.records.map(record => {
            const reportedProps = new ReportedProps(record.get("r").properties);
            return reportedProps;
        });
    }

    private async checkIfUserReportedPost(postId: UUID, userId: UUID): Promise<boolean> {
        const queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (p:Post { postId: $postId })<-[r:${UserToPostRelTypes.REPORTED}]-(u:User { userId: $userId })
            RETURN r
            `,
            {
                postId: postId,
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
        if (user === undefined) throw new HttpException("User not found", 404);
        return user;
    }
}
