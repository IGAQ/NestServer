import { Test, TestingModule } from "@nestjs/testing";
import { IPostsRepository } from "./posts.repository.inerface";
import { PostsRepository } from "./posts.respository";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Neo4jConfig } from "../../../neo4j/neo4jConfig.interface";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../../neo4j/neo4j.constants";
import { createDriver } from "../../../neo4j/neo4j.utils";

describe("PostsRepository", () => {
    let postsRepository: IPostsRepository;

    beforeEach(async () => {
        const neo4jCredentials: Neo4jConfig = {
            scheme: "bolt",
            host: "localhost",
            port: 7687,
            username: "neo4j",
            password: "admin",
            database: "",
        };

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
                {
                    provide: "IPostsRepository",
                    useClass: PostsRepository,
                },
            ],
        }).compile();

        postsRepository = module.get<PostsRepository>("IPostsRepository");
    });

    it("should be defined", () => {
        expect(postsRepository).toBeDefined();
    });

    describe(".findAll()", () => {
        it("should return an array of posts", async () => {
            const posts = await postsRepository.findAll();
            console.log(posts);
            expect(Array.isArray(posts)).toBe(true);
        });

        it("should return an array of posts with a length equal or greater than 0", async () => {});
    });
});
