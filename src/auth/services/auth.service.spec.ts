import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SignInPayloadDto, SignTokenDto } from "../models";
import { UsersRepository } from "../../users/services/usersRepository/users.repository";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../neo4j/neo4j.constants";
import { Neo4jConfig } from "../../neo4j/neo4jConfig.interface";
import { neo4jCredentials } from "../../_domain/constants";
import { createDriver } from "../../neo4j/neo4j.utils";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { Neo4jSeedService } from "../../neo4j/services/neo4j.seed.service";
import { _$ } from "../../_domain/injectableTokens";
import { IUsersRepository } from "../../users/services/usersRepository/users.repository.interface";
import exp from "constants";
import { RegisterUserPayloadDto, User } from "../../users/models";
import { type } from "os";

describe("AuthService", () => {
    let usersRepository: IUsersRepository;

    let authService: AuthService;
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
                JwtService,
                ConfigService,
                {
                    provide: _$.IAuthService,
                    useClass: AuthService,
                },
            ],
        }).compile();

        usersRepository = module.get<UsersRepository>(_$.IUsersRepository);
        authService = module.get<AuthService>(_$.IAuthService);

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
        expect(authService).toBeDefined();
    });

    describe(".signup() and .signIn()", () => {
        let user: User;
        let signTokenDto: SignTokenDto;

        beforeAll(async () => {
            let userToCreate = new RegisterUserPayloadDto({
                username: "test",
                password: "test",
                email: "a@test.com",
            });

            signTokenDto = await authService.signup(userToCreate);

            user = await usersRepository.findUserByUsername("test");
        });

        it("should make the new user in the database", async () => {
            expect(user).toBeDefined();
            expect(user.username).toBe("test");
        });

        it("should return a jwt token", async () => {
            expect(signTokenDto).toBeDefined();
            expect(signTokenDto.access_token).toBeDefined();
            expect(typeof signTokenDto.access_token).toBe("string");
            expect(signTokenDto.access_token).toMatch(
                /^[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+.[A-Za-z0-9-_.+/=]*$/
            );
        });

        it("should let the reason login.", async () => {
            let signInPayloadDto = new SignInPayloadDto({
                username: "test",
                password: "test",
            });

            let signTokenDto = await authService.signIn(signInPayloadDto);

            expect(signTokenDto).toBeDefined();
            expect(signTokenDto.access_token).toBeDefined();
            expect(typeof signTokenDto.access_token).toBe("string");
            expect(signTokenDto.access_token).toMatch(
                /^[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+.[A-Za-z0-9-_.+/=]*$/
            );
        });

        afterAll(async () => {
            await usersRepository.deleteUser(user.userId);
        });
    });
});

