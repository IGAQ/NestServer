import { IPostTagsRepository } from "../posts/services/postTagRepository/postTags.repository.interface";

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
    IPostTagsRepository: Symbol("IPostTagsRepository"),
    IPostsService: Symbol("IPostsService"),

    // Neo4j Module
    INeo4jService: Symbol("INeo4jService"),
};
export { injectableTokens as _$ };
