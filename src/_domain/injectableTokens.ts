import { IUserHistoryService } from "../users/services/userHistory/userHistory.service.interface";
import { IGoogleCloudRecaptchaEnterpriseService } from "../google-cloud-recaptcha-enterprise/google-cloud-recaptcha-enterprise.service.interface";

const injectableTokens = {
    // Database Context
    IDatabaseContext: Symbol.for("IDatabaseContext"),

    // Auth Module
    IAuthService: Symbol("IAuthService"),

    // Users Module
    IUsersRepository: Symbol("IUsersRepository"),
    ISexualityRepository: Symbol("ISexualityRepository"),
    IOpennessRepository: Symbol("IOpennessRepository"),
    IGenderRepository: Symbol("IGenderRepository"),
    IProfileSetupService: Symbol("IProfileSetupService"),
    IUserHistoryService: Symbol("IUserHistoryService"),

    // Posts Module
    IPostsRepository: Symbol("IPostsRepository"),
    IPostTypesRepository: Symbol("IPostTypesRepository"),
    IPostTagsRepository: Symbol("IPostTagsRepository"),
    IPostsService: Symbol("IPostsService"),
    IPostAwardRepository: Symbol("IPostAwardRepository"),
    IPostsReportService: Symbol("IPostsReportService"),

    // Comments Module
    ICommentsRepository: Symbol("ICommentsRepository"),
    ICommentsService: Symbol("ICommentsService"),
    ICommentsReportService: Symbol("ICommentsReportService"),

    // Neo4j Module
    INeo4jService: Symbol("INeo4jService"),

    // Moderation Module
    IAutoModerationService: Symbol("IAutoModerationService"),
    IModeratorActionsService: Symbol("IModeratorActionsService"),

    // Google Cloud reCAPTCHA Enterprise Module
    IGoogleCloudRecaptchaEnterpriseService: Symbol("IGoogleCloudRecaptchaEnterpriseService"),
};
export { injectableTokens as _$ };
