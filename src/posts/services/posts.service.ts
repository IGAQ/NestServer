import { HttpException, Inject, Injectable, Logger, Scope } from "@nestjs/common";
import { PostCreationPayloadDto } from "../models/postCreationPayload.dto";
import { User } from "../../users/models";
import {
    HateSpeechRequestPayloadDto,
    HateSpeechResponseDto,
    Post,
    PostTag,
    VotePostPayloadDto,
    VoteType,
} from "../models";
import { IPostsService } from "./posts.service.interface";
import { _$ } from "../../_domain/injectableTokens";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { catchError, lastValueFrom, map, throwError } from "rxjs";
import { WasOffendingProps } from "../../users/models/toSelf";
import { DeletedProps } from "../models/toSelf";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { UserToPostRelTypes } from "../../users/models/toPost";

@Injectable({ scope: Scope.REQUEST })
export class PostsService implements IPostsService {
    private readonly _logger = new Logger(PostsService.name);
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

    public async authorNewPost(postPayload: PostCreationPayloadDto): Promise<Post> {
        let user = this.getUserFromRequest();
        // validate the post payload
        const postType = await this._dbContext.PostTypes.findPostTypeById(postPayload.postTypeId);
        if (postType === undefined) throw new Error("Post type not found");

        const postTags = new Array<PostTag>(postPayload.postTagIds.length);
        for (let i in postPayload.postTagIds) {
            const postTagId = postPayload.postTagIds[i];
            const foundPostTag = await this._dbContext.PostTags.getPostTagById(postTagId);
            if (foundPostTag === undefined) throw new Error("Post tag not found: " + postTagId);

            postTags[i] = foundPostTag;
        }

        // auto-moderation
        let autoModerationApiKey = this._configService.get<string>("MODERATE_HATESPEECH_API_KEY");
        let autoModerationApiUrl = this._configService.get<string>("MODERATE_HATESPEECH_API_URL");

        const hateSpeechResponseDto = await lastValueFrom(
            this._httpService
                .post<HateSpeechResponseDto>(
                    autoModerationApiUrl,
                    new HateSpeechRequestPayloadDto({
                        token: autoModerationApiKey,
                        text: postPayload.postTitle + postPayload.postContent,
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
                        userContent: postPayload.postTitle + postPayload.postContent,
                        autoModConfidenceLevel: hateSpeechResponseDto.confidence,
                    })
                );
                throw new Error("Hate speech detected");
            }
        }

        // get all records of them offending. And, get all posts that this user authored.
        const userOffendingRecords = await user.getWasOffendingRecords();
        const userAuthoredPosts = await user.getAuthoredPosts();

        // lazy-query the restriction state of the posts.
        for (let i in userAuthoredPosts) {
            await userAuthoredPosts[i].getRestricted();
        }

        // calculate the honour level of the user. (0 < honourLevel < 1)
        const numberOfCleanPosts = userAuthoredPosts.map(
            p => !p.pending && p.restrictedProps === null
        ).length;

        const honourGainHardshipCoefficient = 0.1; // 0.1 means: for the user to achieve the full level of honour, they need at least 10 clean posts while not having any offending records.

        let honourLevel =
            (1 + numberOfCleanPosts * honourGainHardshipCoefficient) /
            (2 + userOffendingRecords.length);
        honourLevel = honourLevel > 1 ? 1 : honourLevel;

        // if moderation passed, create post and return it.
        return await this._dbContext.Posts.addPost(
            new Post({
                postType: postType,
                postTags: postTags,
                postTitle: postPayload.postTitle,
                postContent: postPayload.postContent,
                authorUser: user,
                pending: honourLevel < 0.4, // the post will not be in the pending state only if user's honour level is higher than 0.4
            }),
            postPayload.anonymous
        );
    }

    public async getQueeryOfTheDay(): Promise<Post> {
        let allPosts = await this._dbContext.Posts.findAll();
        if (allPosts.length === 0)
            throw new HttpException(
                "No posts found in the database. Please checkout this application's usage tutorials.",
                404
            );

        const queeryPosts: Post[] = [];
        for (let i in allPosts) {
            if (!allPosts[i].pending) continue;

            await allPosts[i].getDeletedProps();
            if (allPosts[i].deletedProps !== null) continue;

            await allPosts[i].getRestricted();
            if (allPosts[i].restrictedProps !== null) continue;

            await allPosts[i].getPostType();
            if (allPosts[i].postType.postType === "Queery") {
                queeryPosts.push(allPosts[i]);
            }
        }

        if (queeryPosts.length === 0) throw new HttpException("No Queery posts found", 404);

        let queeryOfTheDayIndex = Math.floor(Math.random() * queeryPosts.length);
        return queeryPosts[queeryOfTheDayIndex];
    }

    public async findPostById(postId: string): Promise<Post> {
        let foundPost = await this._dbContext.Posts.findPostById(postId);
        if (foundPost === null) throw new HttpException("Post not found", 404);

        if (foundPost.pending)
            throw new HttpException("Post cannot be shown publicly due to striking policies", 403);

        await foundPost.getDeletedProps();
        if (foundPost.deletedProps !== null) throw new HttpException("Post was deleted", 404);

        await foundPost.getRestricted();
        if (foundPost.restrictedProps !== null) throw new HttpException("Post is restricted", 404);

        return await foundPost.toJSON();
    }

    public async markAsDeleted(postId: string): Promise<void> {
        let post = await this._dbContext.Posts.findPostById(postId);
        if (post === undefined) throw new Error("Post not found");

        await post.getDeletedProps();
        if (post.deletedProps !== null) throw new Error("Post already deleted");

        await post.getAuthorUser();

        await post.setDeletedProps(
            new DeletedProps({
                deletedAt: new Date().getTime(),
                deletedByUserId: post.authorUser.userId,
            })
        );
    }

    public async votePost(votePostPayload: VotePostPayloadDto): Promise<void> {
        let user = this.getUserFromRequest();

        let post = await this._dbContext.Posts.findPostById(votePostPayload.postId);
        if (post === undefined) throw new HttpException("Post not found", 404);

        let queryResult = await this._dbContext.neo4jService.tryReadAsync(
            `
            MATCH (u:User { userId: $userId })-[r:${UserToPostRelTypes.UPVOTES}|${UserToPostRelTypes.DOWN_VOTES}]->(p:Post { postId: $postId })
            `,
            {
                userId: user.userId,
                postId: votePostPayload.postId,
            }
        );

        if (queryResult.records.length > 0) {
            let relType = queryResult.records[0].get("r").type;
            if (relType === UserToPostRelTypes.UPVOTES && votePostPayload.voteType === VoteType.UPVOTES) {
                throw new HttpException("User already upvoted this post", 400);
            } else if (relType === UserToPostRelTypes.DOWN_VOTES && votePostPayload.voteType === VoteType.DOWN_VOTES) {
                throw new HttpException("User already downvoted this post", 400);
            } else {
                await this._dbContext.neo4jService.tryWriteAsync(
                    `
                    MATCH (u:User { userId: $userId })-[r:${relType}]->(p:Post { postId: $postId })
                    DELETE r
                    `,
                    {
                        userId: user.userId,
                        postId: votePostPayload.postId,
                    }
                );
            }
        }

        await this._dbContext.neo4jService.tryWriteAsync(
            `
            MATCH (u:User { userId: $userId }), (p:Post { postId: $postId })
            MERGE (u)-[r:${votePostPayload.voteType}]->(p)
            `,
            {
                userId: user.userId,
                postId: votePostPayload.postId,
            });
    }

    private getUserFromRequest(): User {
        let user = this._request.user as User;
        if (user === undefined) throw new Error("User not found");
        return user;
    }
}
