import { Module } from "@nestjs/common";
import { _$ } from "../_domain/injectableTokens";
import { GoogleCloudRecaptchaEnterpriseService } from "./google-cloud-recaptcha-enterprise.service";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: _$.IGoogleCloudRecaptchaEnterpriseService,
            useClass: GoogleCloudRecaptchaEnterpriseService,
        },
    ],
    exports: [
        {
            provide: _$.IGoogleCloudRecaptchaEnterpriseService,
            useClass: GoogleCloudRecaptchaEnterpriseService,
        },
    ],
})
export class GoogleCloudRecaptchaEnterpriseModule {}
