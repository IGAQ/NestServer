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
                throw new Error("Hate speech detected");
            }
        }

        // if moderation passed, create post and return it.
        await this._dbContext.Posts.addPost(new Post({
            postType: postType,
            postTags: postTags,
            postTitle: postPayload.postTitle,
            postContent: postPayload.postContent,
            authorUser: user,
            pending: false,
        }), postPayload.anonymous);

        throw new Error("Not implemented");
    }
}
