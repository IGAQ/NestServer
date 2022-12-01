import { Module } from "@nestjs/common";
import { _$ } from "../_domain/injectableTokens";
import { PusherService } from "./services/pusher/pusher.service";
import { PusherController } from "./controllers/pusher.controller";
import { PusherUserPoolService } from "./services/pusherUserPoolServer/pusherUserPool.service";

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
    ],
    exports: [
        {
            provide: _$.IPusherService,
            useClass: PusherService,
        },
    ],
    controllers: [PusherController],
})
export class PusherModule {}
