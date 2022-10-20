import { Inject, Injectable, Logger } from "@nestjs/common";
import { PostCreationPayloadDto } from "../models/postCreationPayload.dto";
import { User } from "../../users/models";
import { Post, PostTag, HateSpeechResponseDto, HateSpeechRequestPayloadDto } from "../models";
import { IPostsService } from "./posts.service.interface";
import { _$ } from "../../_domain/injectableTokens";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { catchError, lastValueFrom, map, throwError } from "rxjs";
import { WasOffendingProps } from "../../users/models/toSelf";

@Injectable()
export class PostsService implements IPostsService {
    private readonly logger = new Logger(PostsService.name);
    private readonly _dbContext: DatabaseContext;
    private readonly _httpService: HttpService;
    private readonly _configService: ConfigService;

    constructor(
        @Inject(_$.IDatabaseContext) databaseContext: DatabaseContext,
        httpService: HttpService,
        configService: ConfigService) {
        this._dbContext = databaseContext;
        this._httpService = httpService;
        this._configService = configService;
    }

    public async authorNewPost(postPayload: PostCreationPayloadDto, user: User): Promise<Post> {
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
            this._httpService.post<HateSpeechResponseDto>(autoModerationApiUrl, new HateSpeechRequestPayloadDto({
                token: autoModerationApiKey,
                text: postPayload.postTitle + postPayload.postContent,
            })).pipe(
                map(response => response.data),
                catchError((err) => {
                    this.logger.error(err);
                    return throwError(() => err);
                }),
            )
        );

        // if moderation failed, throw error
        if (hateSpeechResponseDto.class === "flag") {
            if (hateSpeechResponseDto.confidence >= 0.8) {
                // TODO: create a ticket for the admin to review

				await user.addWasOffendingRecord(new WasOffendingProps({
					timestamp: new Date().getTime(),
					userContent: postPayload.postTitle + postPayload.postContent,
					autoModConfidenceLevel: hateSpeechResponseDto.confidence,
				}));
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
		const numberOfCleanPosts = userAuthoredPosts.map(p => !p.pending && p.restrictedProps === null).length;

		const honourGainHardshipCoefficient = 0.1; // 0.1 means: for the user to achieve the full level of honour, they need at least 10 clean posts while not having any offending records.

		let honourLevel = (1 + (numberOfCleanPosts * honourGainHardshipCoefficient)) / (2 + userOffendingRecords.length);
		honourLevel = honourLevel > 1 ? 1 : honourLevel;

        // if moderation passed, create post and return it.
        return await this._dbContext.Posts.addPost(new Post({
            postType: postType,
            postTags: postTags,
            postTitle: postPayload.postTitle,
            postContent: postPayload.postContent,
            authorUser: user,
			pending: honourLevel < 0.4, // the post will not be in the pending state only if user's honour level is higher than 0.4
        }), postPayload.anonymous);
    }
}
