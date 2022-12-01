import { forwardRef, Module } from "@nestjs/common";
import { AutoModerationService } from "./services/autoModeration/autoModeration.service";
import { ModeratorActionsService } from "./services/moderatorActions/moderatorActions.service";
import { _$ } from "../_domain/injectableTokens";
import { HttpModule } from "@nestjs/axios";
import { DatabaseAccessLayerModule } from "../database-access-layer/database-access-layer.module";
import { ModerationController } from "./controllers/moderation.controller";
import { PusherModule } from "../pusher/pusher.module";

@Module({
    imports: [HttpModule, forwardRef(() => DatabaseAccessLayerModule), PusherModule],
    providers: [
        {
            provide: _$.IAutoModerationService,
            useClass: AutoModerationService,
        },
        {
            provide: _$.IModeratorActionsService,
            useClass: ModeratorActionsService,
        },
    ],
    exports: [
        {
            provide: _$.IAutoModerationService,
            useClass: AutoModerationService,
        },
        {
            provide: _$.IModeratorActionsService,
            useClass: ModeratorActionsService,
        },
    ],
    controllers: [ModerationController],
})
export class ModerationModule {}
