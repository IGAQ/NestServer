import { Test, TestingModule } from "@nestjs/testing";
import { User } from "../../models";
import { UsersRepository } from "./users.repository";
import { IUsersRepository } from "./users.repository.interface";
import { Neo4jSeedService } from "../../../neo4j/services/neo4j.seed.service";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../../neo4j/neo4j.constants";
import { Neo4jConfig } from "../../../neo4j/neo4jConfig.interface";
import { neo4jCredentials } from "../../../_domain/constants";
import { createDriver } from "../../../neo4j/neo4j.utils";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { v4 as uuidv4 } from "uuid";
import { _$ } from "../../../_domain/injectableTokens";

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
                    provide: _$.IUsersRepository,
                    useClass: UsersRepository,
                },
            ],
        }).compile();

        usersRepository = module.get<UsersRepository>(_$.IUsersRepository);

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
            users.forEach(user => {
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

    describe(".addUser() and .deleteUser()", () => {
        let user: User;

        const preAssignedUuid4 = uuidv4();

        beforeAll(async () => {
            user = await usersRepository.addUser(
                new User({
                    userId: preAssignedUuid4,
                    username: "test",
                    passwordHash: "test",
                    email: "a@test.com",
                })
            );
        });

        it("should return a user", async () => {
            expect(user).toBeDefined();
            expect(user.userId).toBe(preAssignedUuid4);
            expect(user.username).toBe("test");
            expect(user.normalizedUsername).toBe("TEST");
            expect(user.passwordHash).toBe("test");
            expect(user.email).toBe("a@test.com");
        });

        afterAll(async () => {
            await usersRepository.deleteUser(preAssignedUuid4);
            const foundUser = await usersRepository.findUserById(preAssignedUuid4);
            expect(foundUser).toBeUndefined();
        });
    });

    describe(".updateUser()", () => {
        let user: User;

        const preAssignedUuid4 = uuidv4();

        beforeAll(async () => {
            user = await usersRepository.addUser(
                new User({
                    userId: preAssignedUuid4,
                    username: "test",
                    passwordHash: "test",
                    email: "a@test.com",
                })
            );

            user.emailVerified = true;
            user.phoneNumber = "123456789";

            await usersRepository.updateUser(user);

            user = await usersRepository.findUserById(preAssignedUuid4);
        });

        it("should have the updated properties", async () => {
            console.log(user);
            expect(user.emailVerified).toBe(true);
            expect(user.phoneNumber).toBe("123456789");
        });

        afterAll(async () => {
            await usersRepository.deleteUser(preAssignedUuid4);
            const foundUser = await usersRepository.findUserById(preAssignedUuid4);
            expect(foundUser).toBeUndefined();
        });
    });
});
