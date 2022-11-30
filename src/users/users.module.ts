import { forwardRef, Module } from "@nestjs/common";
import { UsersRepository } from "./repositories/users/users.repository";
import { UsersController } from "./controllers/users.controller";
import { _$ } from "../_domain/injectableTokens";
import { DatabaseAccessLayerModule } from "../database-access-layer/database-access-layer.module";
import { ProfileSetupService } from "./services/profileSetup/profileSetup.service";
import { GenderRepository } from "./repositories/gender/gender.repository";
import { SexualityRepository } from "./repositories/sexuality/sexuality.repository";
import { OpennessRepository } from "./repositories/openness/openness.repository";
import { SexualitiesController } from "./controllers/sexualities.controller";
import { GendersController } from "./controllers/genders.controller";
import { OpennessController } from "./controllers/openness.controller";
import { UserHistoryService } from "./services/userHistory/userHistory.service";
import { ModerationModule } from "../moderation/moderation.module";
import { GoogleCloudRecaptchaEnterpriseModule } from "../google-cloud-recaptcha-enterprise/google-cloud-recaptcha-enterprise.module";

@Module({
    imports: [
        forwardRef(() => DatabaseAccessLayerModule),
        ModerationModule,
        GoogleCloudRecaptchaEnterpriseModule,
    ],
    providers: [
        {
            provide: _$.IUsersRepository,
            useClass: UsersRepository,
        },
        {
            provide: _$.IProfileSetupService,
            useClass: ProfileSetupService,
        },
        {
            provide: _$.IUserHistoryService,
            useClass: UserHistoryService,
        },
        {
            provide: _$.IGenderRepository,
            useClass: GenderRepository,
        },
        {
            provide: _$.ISexualityRepository,
            useClass: SexualityRepository,
        },
        {
            provide: _$.IOpennessRepository,
            useClass: OpennessRepository,
        },
    ],
    exports: [
        {
            provide: _$.IUsersRepository,
            useClass: UsersRepository,
        },
        {
            provide: _$.IProfileSetupService,
            useClass: ProfileSetupService,
        },
        {
            provide: _$.IUserHistoryService,
            useClass: UserHistoryService,
        },
        {
            provide: _$.IGenderRepository,
            useClass: GenderRepository,
        },
        {
            provide: _$.ISexualityRepository,
            useClass: SexualityRepository,
        },
        {
            provide: _$.IOpennessRepository,
            useClass: OpennessRepository,
        },
    ],
    controllers: [UsersController, SexualitiesController, GendersController, OpennessController],
})
export class UsersModule {}
