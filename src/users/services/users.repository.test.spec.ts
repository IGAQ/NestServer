import { Test, TestingModule } from "@nestjs/testing";
import { User } from "../models";
import { UsersRepository } from "./users.repository";
import { IUsersRepository } from "./users.repository.interface";
import { Neo4jSeedService } from "../../neo4j/services/neo4j.seed.service";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../neo4j/neo4j.constants";
import { Neo4jConfig } from "../../neo4j/neo4jConfig.interface";
import { neo4jCredentials } from "../../common/constants";
import { createDriver } from "../../neo4j/neo4j.utils";
import { Neo4jService } from "../../neo4j/services/neo4j.service";

describe("UsersRepository", () => {
    let usersRepository: IUsersRepository;
    let neo4jSeedService: Neo4jSeedService;
    let seedCalled = false;

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
                    provide: "IUsersRepository",
                    useClass: UsersRepository,
                },
            ],
        }).compile();

        usersRepository = module.get<UsersRepository>("IUsersRepository");

        neo4jSeedService = module.get<Neo4jSeedService>(Neo4jSeedService);
        try {
            if (!seedCalled) {
                seedCalled = true;
                await neo4jSeedService.seed();
            }
        } catch (error) {
            console.error(error);
        }
    });

    it("should be defined", () => {
        expect(usersRepository).toBeDefined();
        expect(neo4jSeedService).toBeDefined();
    });

    describe(".findAll()", () => {
        let users: User[];

        beforeAll(async () => {
            users = await usersRepository.findAll();
        });

        it("should return an array of users", async () => {
            expect(Array.isArray(users)).toBe(true);
        });

        it("should return an array of users with a length equal or greater than 0", async () => {
            expect(users.length).toBeGreaterThanOrEqual(0);
        });

        it("every user has to only have the Node properties at the beginning", async () => {
            users.forEach((user) => {
                expect(user.posts).toBeUndefined();
                expect(user.gender).toBeUndefined();
                expect(user.sexuality).toBeUndefined();
                expect(user.openness).toBeUndefined();
            });
        });
    });

    describe(".findUserByUsername()", () => {
        let user: User;

        beforeAll(async () => {
            user = await usersRepository.findUserByUsername("leo");
        });

        it("should return a user", async () => {
            expect(user).toBeDefined();
        });

        it("post has to only have the Node properties at the beginning", async () => {
            expect(user.posts).toBeUndefined();
            expect(user.gender).toBeUndefined();
            expect(user.sexuality).toBeUndefined();
            expect(user.openness).toBeUndefined();
        });
    });

    describe(".findUserById()", () => {
        let user: User;

        beforeAll(async () => {
            user = await usersRepository.findUserById("3109f9e2-a262-4aef-b648-90d86d6fbf6c");
        });

        it("should return a user", async () => {
            expect(user).toBeDefined();
        });

        it("post has to only have the Node properties at the beginning", async () => {
            expect(user.posts).toBeUndefined();
            expect(user.gender).toBeUndefined();
            expect(user.sexuality).toBeUndefined();
            expect(user.openness).toBeUndefined();
        });
    });
});
