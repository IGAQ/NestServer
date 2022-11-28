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

    // Posts Module
    IPostsRepository: Symbol("IPostsRepository"),
    IPostTypesRepository: Symbol("IPostTypesRepository"),
    IPostTagsRepository: Symbol("IPostTagsRepository"),
    IPostsService: Symbol("IPostsService"),
    IPostAwardRepository: Symbol("IPostAwardRepository"),

    // Comments Module
    ICommentsRepository: Symbol("ICommentsRepository"),
    ICommentsService: Symbol("ICommentsService"),

    // Neo4j Module
    INeo4jService: Symbol("INeo4jService"),

    // Moderation Module
    IAutoModerationService: Symbol("IAutoModerationService"),
    IModeratorActionsService: Symbol("IModeratorActionsService"),
};
export { injectableTokens as _$ };
