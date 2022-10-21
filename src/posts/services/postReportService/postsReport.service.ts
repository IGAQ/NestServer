import { ReportPostPayloadDto } from "../../models";
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

	constructor(@Inject(REQUEST) request: Request,
				@Inject(_$.IDatabaseContext) databaseContext: DatabaseContext
	) {
		this._request = request;
		this._dbContext = databaseContext;
	}

	public async reportPost(reportPostPayload: ReportPostPayloadDto): Promise<void> {
		let user = this.getUserFromRequest();

		let post = await this._dbContext.Posts.findPostById(reportPostPayload.postId);
		if (post === undefined) throw new Error("Post not found");

		if (post.pending || post.restrictedProps !== null) {
			throw new HttpException("Post cannot be reported due to being pending or restricted", 400);
		}

		let reports = await this.getReportsForPost(post.postId);

		if (reports.some(r => r.reportedBy.userId === user.userId)) {
			throw new HttpException("Post already reported", 400);
		}

		await post.getAuthorUser();
		if (post.authorUser.userId === user.userId) {
			throw new HttpException("Post cannot be reported by post author", 400);
		}

		await this._dbContext.neo4jService.tryWriteAsync(
			`
			MATCH (p:Post { postId: $postId }), (u:User { userId: $userId })
				MERGE (u)-[r:${UserToPostRelTypes.REPORTED}]->(p)
			`,
			{
				postId: post.postId,
				userId: user.userId,
			});
	}

	public async getReportsForPost(postId: string): Promise<ReportedProps[]> {
		const queryResult = await this._dbContext.neo4jService.tryReadAsync(
			`
			MATHC (p:Post { postId: $postId })<-[r:${UserToPostRelTypes.REPORTED}]-(u:User)`,
			{
				postId: postId
			}
		);
		return queryResult.records.map(record => {
			let reportedProps = new ReportedProps(record.get("r").properties);
			reportedProps.reportedBy = new User(record.get("u").properties, this._dbContext.neo4jService);
			return reportedProps;
		});
	}

	private getUserFromRequest(): User {
		let user = this._request.user as User;
		if (user === undefined) throw new Error("User not found");
		return user;
	}
}