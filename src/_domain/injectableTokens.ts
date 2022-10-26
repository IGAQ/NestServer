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

    // Posts Module
    IPostsRepository: Symbol("IPostsRepository"),
    IPostTypesRepository: Symbol("IPostTypesRepository"),
    IPostTagsRepository: Symbol("IPostTagsRepository"),
    IPostsService: Symbol("IPostsService"),
    IPostAwardRepository: Symbol("IPostAwardRepository"),

    // Neo4j Module
    INeo4jService: Symbol("INeo4jService"),
};
export { injectableTokens as _$ };
