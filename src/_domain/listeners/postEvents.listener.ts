import { Inject, Injectable, Logger, Scope } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ChannelTypesEnum, PusherEvents } from "../../pusher/pusher.types";
import { PostGotVoteEvent } from "../../posts/events";
import { PostGotApprovedByModeratorEvent, PostGotRestrictedEvent } from "../../moderation/events";
import { _$ } from "../injectableTokens";
import { IPusherService } from "../../pusher/services/pusher/pusher.service.interface";
import { INotificationMessageMakerService } from "../../pusher/services/notificationMessageMaker/notificationMessageMaker.service.interface";
import { EventTypes } from "../eventTypes";
import { INotificationStashPoolService } from "../../pusher/services/notificationStashPool/notificationStashPool.service.interface";
import { generateUUID } from "../utils";

@Injectable({ scope: Scope.DEFAULT })
export class PostEventsListener {
    private readonly _logger = new Logger(PostEventsListener.name);

    private readonly _pusherService: IPusherService;
    private readonly _notificationMessageMakerService: INotificationMessageMakerService;
    private readonly _notificationStashPoolService: INotificationStashPoolService;

    constructor(
        @Inject(_$.IPusherService) pusherService: IPusherService,
        @Inject(_$.INotificationMessageMakerService)
        notificationMessageMakerService: INotificationMessageMakerService,
        @Inject(_$.INotificationStashPoolService)
        notificationStashPoolService: INotificationStashPoolService
    ) {
        this._pusherService = pusherService;
        this._notificationMessageMakerService = notificationMessageMakerService;
        this._notificationStashPoolService = notificationStashPoolService;
    }

    @OnEvent(EventTypes.PostGotUpVote, { async: true })
    public async handlePostGotUpVote(event: PostGotVoteEvent): Promise<void> {
        console.log("event listener emitted");
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForPostGotUpVote({
            username: event.username,
            postId: event.postId,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.PostGotUpVote,
            event.subscriberId,
            event.username,
            event.avatar,
            message
        );
    }

    @OnEvent(EventTypes.PostGotDownVote, { async: true })
    public async handlePostGotDownVote(event: PostGotVoteEvent): Promise<void> {
        console.log("event listener emitted");
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;

        const message = this._notificationMessageMakerService.makeForPostGotDownVote({
            username: event.username,
            postId: event.postId,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.PostGotDownVote,
            event.subscriberId,
            event.username,
            event.avatar,
            message
        );
    }

    @OnEvent(EventTypes.PostGotApprovedByModerator, { async: true })
    public async handlePostGotApprovedByModerator(
        event: PostGotApprovedByModeratorEvent
    ): Promise<void> {
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForPostGotApprovedByModerator({
            username: event.username,
            postId: event.postId,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.PostGotApprovedByModerator,
            event.subscriberId,
            event.username,
            event.avatar,
            message
        );
    }

    @OnEvent(EventTypes.PostGotRestricted, { async: true })
    public async handlePostGotRestricted(event: PostGotRestrictedEvent): Promise<void> {
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForPostGotRestricted({
            postTitle: event.postTitle,
            reason: event.reason,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.PostGotRestricted,
            event.subscriberId,
            event.username,
            event.avatar,
            message
        );
    }

    private async stashAndPushNotification(
        stashToken: UUID,
        evenType: EventTypes,
        subscriberId: UUID,
        username: string,
        avatar: string,
        message: string
    ): Promise<void> {
        const stashPoolItem = await this._notificationStashPoolService.stashNotification(
            stashToken,
            subscriberId,
            message
        );

        this._pusherService
            .triggerUser(
                ChannelTypesEnum.IGAQ_Notification,
                PusherEvents.UserReceivesNotification,
                subscriberId,
                {
                    subscriberId,
                    username: username,
                    avatar: avatar,
                    composedMessage: message,
                    stashToken: stashToken,
                }
            )
            .then(() => this._logger.verbose(`Event ${evenType} got pushed to ${username}`))
            .catch(e => this._logger.error(`Event ${evenType} ERRORED: `, e));
    }
}
