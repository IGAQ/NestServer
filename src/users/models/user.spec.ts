import { IUsersRepository } from "../services/users.repository.interface";
import { Test, TestingModule } from "@nestjs/testing";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../neo4j/neo4j.constants";
import { Neo4jConfig } from "../../neo4j/neo4jConfig.interface";
import { neo4jCredentials } from "../../common/constants";
import { createDriver } from "../../neo4j/neo4j.utils";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { UsersRepository } from "../services/users.repository";
import { User } from "./user";

describe("Post Model Unit Test", () => {
    let usersRepository: IUsersRepository;

    let user: User;

    beforeAll(async () => {
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
                    provide: "IUsersRepository",
                    useClass: UsersRepository,
                },
            ],
        }).compile();

        usersRepository = module.get<UsersRepository>("IUsersRepository");
    });

    it("should be defined", () => {
        expect(usersRepository).toBeDefined();
    });

    describe("given a post instance", () => {
        beforeAll(async () => {
            user = await usersRepository.findUserById("5c0f145b-ffad-4881-8ee6-7647c3c1b695");
        });

        it("instance must exist", async () => {
            expect(user).toBeDefined();
        });

        describe("given user.getAuthoredPosts() called", () => {
            beforeEach(async () => {
                user = await usersRepository.findUserById("5c0f145b-ffad-4881-8ee6-7647c3c1b695");
            });

            it("should return an array", async () => {
                let users = await user.getAuthoredPosts();
                expect(Array.isArray(users)).toBe(true);
                expect(users.length).toBeGreaterThanOrEqual(0);
            });
        });
    });
});