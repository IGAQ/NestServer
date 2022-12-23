import { Inject, Injectable, Logger, Scope } from "@nestjs/common";
import { IPusherService } from "../../pusher/services/pusher/pusher.service.interface";
import { _$ } from "../injectableTokens";
import { OnEvent } from "@nestjs/event-emitter";
import { ChannelTypesEnum, PusherEvents } from "../../pusher/pusher.types";
import {
    CommentGotApprovedByModeratorEvent,
    CommentGotRestrictedEvent,
} from "../../moderation/events";
import {
    CommentGotPinnedByAuthorEvent,
    CommentGotVoteEvent,
    NewCommentEvent,
} from "../../comments/events";
import { INotificationMessageMakerService } from "../../pusher/services/notificationMessageMaker/notificationMessageMaker.service.interface";
import { EventTypes } from "../eventTypes";
import { INotificationStashPoolService } from "../../pusher/services/notificationStashPool/notificationStashPool.service.interface";
import { generateUUID } from "../utils";

@Injectable({ scope: Scope.DEFAULT })
export class CommentEventsListener {
    private readonly _logger = new Logger(CommentEventsListener.name);

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

    @OnEvent(EventTypes.CommentGotUpVote, { async: true })
    public async handleCommentGotUpVote(event: CommentGotVoteEvent): Promise<void> {
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForCommentGotUpVote({
            username: event.username,
            postId: event.postId,
            commentId: event.commentId,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.CommentGotUpVote,
            event.subscriberId,
            event.username,
            event.avatar,
            message
        );
    }

    @OnEvent(EventTypes.CommentGotDownVote, { async: true })
    public async handleCommentGotDownVote(event: CommentGotVoteEvent): Promise<void> {
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForCommentGotDownVote({
            username: event.username,
            postId: event.postId,
            commentId: event.commentId,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.CommentGotDownVote,
            event.subscriberId,
            event.username,
            event.avatar,
            message
        );
    }

    @OnEvent(EventTypes.CommentGotRestricted, { async: true })
    public async handleCommentGotRestricted(event: CommentGotRestrictedEvent): Promise<void> {
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForCommentGotRestricted({
            commentContent: event.commentContent,
            reason: event.reason,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.CommentGotRestricted,
            event.subscriberUserId,
            event.username,
            event.avatar,
            message
        );
    }

    @OnEvent(EventTypes.CommentGotPinnedByAuthor, { async: true })
    public async handleCommentGotPinnedByAuthor(
        event: CommentGotPinnedByAuthorEvent
    ): Promise<void> {
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForCommentGotPinnedByAuthor({
            commentId: event.commentId,
            postId: event.postId,
            commentContent: event.commentContent,
            username: event.username,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.CommentGotPinnedByAuthor,
            event.subscriberId,
            event.username,
            event.avatar,
            message
        );
    }

    @OnEvent(EventTypes.CommentGotApprovedByModerator, { async: true })
    public async handleCommentGotApprovedByModerator(
        event: CommentGotApprovedByModeratorEvent
    ): Promise<void> {
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForCommentGotApprovedByModerator({
            commentId: event.commentId,
            postId: event.postId,
            username: event.username,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.CommentGotApprovedByModerator,
            event.subscriberId,
            event.username,
            event.avatar,
            message
        );
    }

    @OnEvent(EventTypes.NewCommentOnComment, { async: true })
    public async handleNewCommentOnComment(event: NewCommentEvent): Promise<void> {
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForNewCommentOnComment({
            postId: event.postId,
            commentId: event.commentId,
            username: event.username,
            commentContent: event.commentContent,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.NewCommentOnComment,
            event.subscriberId,
            event.username,
            event.avatar,
            message
        );
    }

    @OnEvent(EventTypes.NewCommentOnPost, { async: true })
    public async handleNewCommentOnPost(event: NewCommentEvent): Promise<void> {
        const stashToken = generateUUID();
        this._notificationMessageMakerService.stashToken = stashToken;
        const message = this._notificationMessageMakerService.makeForNewCommentOnPost({
            postId: event.postId,
            commentId: event.commentId,
            username: event.username,
            postTypeName: event.postTypeName,
            commentContent: event.commentContent,
        });

        await this.stashAndPushNotification(
            stashToken,
            EventTypes.NewCommentOnPost,
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
            message,
            avatar,
            username
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
