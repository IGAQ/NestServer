import { Module } from "@nestjs/common";
import { _$ } from "../_domain/injectableTokens";
import { PusherService } from "./services/pusher/pusher.service";
import { PusherController } from "./controllers/pusher.controller";
import { PusherUserPoolService } from "./services/pusherUserPoolServer/pusherUserPool.service";
import { NotificationStashPoolService } from "./services/notificationStashPool/notificationStashPool.service";
import { NotificationMessageMakerService } from "./services/notificationMessageMaker/notificationMessageMaker.service";

@Module({
    providers: [
        {
            provide: _$.IPusherService,
            useClass: PusherService,
        },
        {
            provide: _$.IPusherUserPoolService,
            useClass: PusherUserPoolService,
        },
        {
            provide: _$.INotificationStashPoolService,
            useClass: NotificationStashPoolService,
        },
        {
            provide: _$.INotificationMessageMakerService,
            useClass: NotificationMessageMakerService,
        },
    ],
    exports: [
        {
            provide: _$.IPusherService,
            useClass: PusherService,
        },
        {
            provide: _$.INotificationStashPoolService,
            useClass: NotificationStashPoolService,
        },
        {
            provide: _$.INotificationMessageMakerService,
            useClass: NotificationMessageMakerService,
        },
    ],
    controllers: [PusherController],
})
export class PusherModule {}
