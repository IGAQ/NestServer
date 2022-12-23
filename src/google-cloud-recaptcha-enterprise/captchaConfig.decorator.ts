import { SetMetadata } from "@nestjs/common";
import { CaptchaConfigParameters } from "./models/captchaConfigParameters.interface";
import { captchaConfigMetaDataKey } from "./google-cloud-recaptcha-enterprise.constants";

export const CaptchaConfig = (config: CaptchaConfigParameters) =>
    SetMetadata(captchaConfigMetaDataKey, config);
