import { INotificationMessageMakerService } from "../pusher/services/notificationMessageMaker/notificationMessageMaker.service.interface";

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

    // Pusher
    IPusherService: Symbol("IPusherService"),
    IPusherUserPoolService: Symbol("IPusherUserPoolService"),
    INotificationStashPoolService: Symbol("INotificationStashPoolService"),
    INotificationMessageMakerService: Symbol("INotificationMessageMakerService"),
};
export { injectableTokens as _$ };
