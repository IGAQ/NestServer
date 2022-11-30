import { ConfigService } from "@nestjs/config";
import { envKeys } from "./google-cloud-recaptcha-enterprise.constants";
import { AssessmentDto } from "./models/assessment.dto";
import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";
import { IGoogleCloudRecaptchaEnterpriseService } from "./google-cloud-recaptcha-enterprise.service.interface";
import { Injectable, Scope } from "@nestjs/common";

@Injectable({ scope: Scope.REQUEST })
export class GoogleCloudRecaptchaEnterpriseService
    implements IGoogleCloudRecaptchaEnterpriseService
{
    constructor(private _configService: ConfigService) {}

    /**
     * Create an assessment to analyze the risk of an UI action. Note that
     * this example does set error boundaries and returns `null` for
     * exceptions.
     *
     * projectID: GCloud Project ID
     * recaptchaSiteKey: Site key obtained by registering a domain/app to use recaptcha services.
     * token: The token obtained from the client on passing the recaptchaSiteKey.
     * recaptchaAction: Action name corresponding to the token.
     */
    public async createAssessment(assessmentPayload: AssessmentDto): Promise<number | null> {
        const projectID = this._configService.get<string>(envKeys.projectId);
        const recaptchaSiteKey = this._configService.get<string>(envKeys.recaptchaSiteKey);

        // Create the reCAPTCHA client & set the project path. There are multiple
        // ways to authenticate your client. For more information see:
        // https://cloud.google.com/docs/authentication
        // TODO: To avoid memory issues, move this client generation outside
        // of this example, and cache it (recommended) or call client.close()
        // before exiting this method.
        const client = new RecaptchaEnterpriseServiceClient();
        const projectPath = client.projectPath(projectID);

        const request = {
            assessment: {
                event: {
                    token: assessmentPayload.token,
                    siteKey: recaptchaSiteKey,
                },
            },
            parent: projectPath,
        };

        // client.createAssessment() can return a Promise or take a Callback
        const [response] = await client.createAssessment(request);

        // Check if the token is valid.
        if (!response.tokenProperties.valid) {
            console.log(
                "The CreateAssessment call failed because the token was: " +
                    response.tokenProperties.invalidReason
            );

            return null;
        }

        // Check if the expected action was executed.
        // The `action` property is set by user client in the
        // grecaptcha.enterprise.execute() method.
        if (response.tokenProperties.action === assessmentPayload.recaptchaAction) {
            // Get the risk score and the reason(s).
            // For more information on interpreting the assessment,
            // see: https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
            console.log("The reCAPTCHA score is: " + response.riskAnalysis.score);

            response.riskAnalysis.reasons.forEach(reason => {
                console.log(reason);
            });
            return response.riskAnalysis.score;
        } else {
            console.log(
                "The action attribute in your reCAPTCHA tag " +
                    "does not match the action you are expecting to score"
            );
            return null;
        }
    }
}
