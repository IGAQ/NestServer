import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { _$ } from "../_domain/injectableTokens";
import { IGoogleCloudRecaptchaEnterpriseService } from "./google-cloud-recaptcha-enterprise.service.interface";
import {
    captchaConfigMetaDataKey,
    headerKeys as googleCloudRecaptchaEnterpriseHeaders,
} from "./google-cloud-recaptcha-enterprise.constants";
import { AssessmentDto } from "./models/assessment.dto";
import { Reflector } from "@nestjs/core";
import { CaptchaConfigParameters } from "./models/captchaConfigParameters.interface";

@Injectable()
export class CaptchaGuard implements CanActivate {
    constructor(
        @Inject(_$.IGoogleCloudRecaptchaEnterpriseService)
        private readonly _recaptchaEnterpriseService: IGoogleCloudRecaptchaEnterpriseService,
        private reflector: Reflector
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const captchaConfig = this.reflector.get<CaptchaConfigParameters>(
            captchaConfigMetaDataKey,
            context.getHandler()
        );

        const request = context.switchToHttp().getRequest();

        const headers = request.headers;
        const token = headers[googleCloudRecaptchaEnterpriseHeaders.token];
        const recaptchaAction = headers[googleCloudRecaptchaEnterpriseHeaders.recaptchaAction];

        if (!token || !recaptchaAction) {
            return false;
        }

        const assessment = await this._recaptchaEnterpriseService.createAssessment(
            new AssessmentDto({
                token,
                recaptchaAction,
            })
        );
        if (assessment === null) {
            return false;
        }

        return assessment > (captchaConfig?.passScore || 0.6);
    }
}
