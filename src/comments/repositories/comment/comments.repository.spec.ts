import { Neo4jSeedService } from "../../../neo4j/services/neo4j.seed.service";
import { ICommentsRepository } from "./comments.repository.interface";
import { Test, TestingModule } from "@nestjs/testing";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../../neo4j/neo4j.constants";
import { Neo4jConfig } from "../../../neo4j/neo4jConfig.interface";
import { neo4jCredentials } from "../../../_domain/constants";
import { createDriver } from "../../../neo4j/neo4j.utils";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { _$ } from "../../../_domain/injectableTokens";
import { CommentsRepository } from "./comments.repository";

describe("CommentsRepository", () => {
    let commentsRepository: ICommentsRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: NEO4J_OPTIONS,
                    useFactory: (): Neo4jConfig => neo4jCredentials,
                },
                {
                    provide: NEO4J_DRIVER,
                    inject: [NEO4J_OPTIONS],
                    useFactory: async () => createDriver(neo4jCredentials),
                },
                Neo4jService,
                Neo4jSeedService,
                {
                    provide: _$.ICommentsRepository,
                    useClass: CommentsRepository,
                },
            ],
        }).compile();

        commentsRepository = module.get<CommentsRepository>(_$.ICommentsRepository);
    });

    it("should be defined", () => {
        expect(commentsRepository).toBeDefined();
    });
});
