import { Module } from "@nestjs/common";
import { PusherModule } from "../pusher/pusher.module";
import { CommentEventsListener } from "./listeners /commentEvents.listener";
import { PostEventsListener } from "./listeners /postEvents.listener";

@Module({
    imports: [PusherModule],
    providers: [CommentEventsListener, PostEventsListener],
})
export class DomainModule {}
