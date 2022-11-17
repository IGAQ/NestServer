import { Request } from "express";
import { REQUEST } from "@nestjs/core";
import { HttpException, Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { catchError, lastValueFrom, map, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { IAutoModerationService } from "./autoModeration.service.interface";
import { HateSpeechRequestPayloadDto, HateSpeechResponseDto } from "../../../posts/dtos";
import { WasOffendingProps } from "../../../users/models/toSelf";
import { User } from "../../../users/models";

export class AutoModerationService implements IAutoModerationService {
    private readonly _logger = new Logger(AutoModerationService.name);
    private readonly _request: Request;
    private readonly _configService: ConfigService;
    private readonly _httpService: HttpService;

    constructor(
        @Inject(REQUEST) request: Request,
        configService: ConfigService,
        httpService: HttpService
    ) {
        this._request = request;
        this._configService = configService;
        this._httpService = httpService;
    }

    public async checkForHateSpeech(text: string): Promise<boolean> {
        const user = this.getUserFromRequest();

        const autoModerationApiKey = this._configService.get<string>("MODERATE_HATESPEECH_API_KEY");
        const autoModerationApiUrl = this._configService.get<string>("MODERATE_HATESPEECH_API_URL");

        const hateSpeechResponseDto = await lastValueFrom(
            this._httpService
                .post<HateSpeechResponseDto>(
                    autoModerationApiUrl,
                    new HateSpeechRequestPayloadDto({
                        token: autoModerationApiKey,
                        text,
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
            if (hateSpeechResponseDto.confidence >= 0.9) {
                // TODO: create a ticket for the admin to review

                await user.addWasOffendingRecord(
                    new WasOffendingProps({
                        timestamp: new Date().getTime(),
                        userContent: text,
                        autoModConfidenceLevel: hateSpeechResponseDto.confidence,
                    })
                );
                throw new HttpException("Hate speech detected", 400);
            }
        }

        // get all records of them offending. And, get all posts that this user authored.
        const userOffendingRecords = await user.getWasOffendingRecords();
        const userAuthoredPosts = await user.getAuthoredPosts();

        // lazy-query the restriction state of the posts.
        for (const i in userAuthoredPosts) {
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

        // the post will not be in the pending state only if user's honour level is higher than 0.4
        return honourLevel < 0.4;
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new Error("User not found");
        return user;
    }
}
