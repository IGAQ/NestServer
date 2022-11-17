import { Module } from "@nestjs/common";
import { AutoModerationService } from "./services/autoModeration/autoModeration.service";
import { _$ } from "../_domain/injectableTokens";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [HttpModule],
    providers: [
        {
            provide: _$.IAutoModerationService,
            useClass: AutoModerationService,
        },
    ],
    exports: [
        {
            provide: _$.IAutoModerationService,
            useClass: AutoModerationService,
        },
    ],
})
export class ModerationModule {}
