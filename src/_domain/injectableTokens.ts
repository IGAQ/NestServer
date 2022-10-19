const injectableTokens = {
    // Auth Module
    IAuthService: Symbol("IAuthService"),

    // Users Module
    IUsersRepository: Symbol("IUsersRepository"),
    ISexualityRepository: Symbol("ISexualityRepository"),
    IOpennessRepository: Symbol("IOpennessRepository"),
    IGenderRepository: Symbol("IGenderRepository"),

    // Posts Module
    IPostsRepository: Symbol("IPostsRepository"),
    IPostsService: Symbol("IPostsService"),

    // Neo4j Module
    INeo4jService: Symbol("INeo4jService"),
};
export { injectableTokens as _$ };
