import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Inject,
    Post,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { _$ } from "../../_domain/injectableTokens";
import { IPusherService } from "../services/pusher/pusher.service.interface";
import { AuthGuard } from "@nestjs/passport";
import { AuthedUser } from "../../auth/decorators/authedUser.param.decorator";
import { User } from "../../users/models";
import { IPusherUserPoolService } from "../services/pusherUserPoolServer/pusherUserPool.service.interface";
import { NotificationStashPoolItem } from "../models/notificationStashPoolItem.interface";
import { INotificationStashPoolService } from "../services/notificationStashPool/notificationStashPool.service.interface";
import { auth } from "neo4j-driver";

@ApiTags("pusher")
@Controller("pusher")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class PusherController {
    private readonly _pusherService: IPusherService;
    private readonly _pusherUserPoolService: IPusherUserPoolService;
    private readonly _notificationStashPoolService: INotificationStashPoolService;

    constructor(
        @Inject(_$.IPusherService) pusherService: IPusherService,
        @Inject(_$.IPusherUserPoolService) pusherUserPoolService: IPusherUserPoolService,
        @Inject(_$.INotificationStashPoolService)
        notificationStashPoolService: INotificationStashPoolService
    ) {
        this._pusherService = pusherService;
        this._pusherUserPoolService = pusherUserPoolService;
        this._notificationStashPoolService = notificationStashPoolService;
    }

    @Post("/auth")
    @UseGuards(AuthGuard("jwt"))
    public async authenticate(@AuthedUser() authedUser: User): Promise<string> {
        return await this._pusherUserPoolService.addUserToPool(authedUser.userId); // returns poolId
    }

    @Get("/notifications/stash")
    @UseGuards(AuthGuard("jwt"))
    public async getStashedNotifications(
        @AuthedUser() authedUser: User
    ): Promise<NotificationStashPoolItem[]> {
        return await this._notificationStashPoolService.popStashNotifications(authedUser.userId);
    }
}
