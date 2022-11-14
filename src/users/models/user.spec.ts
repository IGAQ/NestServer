import { IUsersRepository } from "../repositories/users/users.repository.interface";
import { Test, TestingModule } from "@nestjs/testing";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../neo4j/neo4j.constants";
import { Neo4jConfig } from "../../neo4j/neo4jConfig.interface";
import { neo4jCredentials } from "../../_domain/constants";
import { createDriver } from "../../neo4j/neo4j.utils";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { UsersRepository } from "../repositories/users/users.repository";
import { User } from "./user";
import { _$ } from "../../_domain/injectableTokens";

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
                    provide: _$.IUsersRepository,
                    useClass: UsersRepository,
                },
            ],
        }).compile();

        usersRepository = module.get<UsersRepository>(_$.IUsersRepository);
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
                const posts = await user.getAuthoredPosts();
                expect(Array.isArray(posts)).toBe(true);
                expect(posts.length).toBeGreaterThanOrEqual(0);
            });

            it("should return an array of posts", async () => {
                const posts = await user.getAuthoredPosts();
                posts.map(post => {
                    expect(post.postId).toBeDefined();
                    expect(post.postContent).toBeDefined();
                });
            });
        });

        describe("given user.getFavoritePosts() called", () => {
            beforeEach(async () => {
                user = await usersRepository.findUserById("5c0f145b-ffad-4881-8ee6-7647c3c1b695");
            });

            it("should return an array of proper objects", async () => {
                const favoritedPosts = await user.getFavoritePosts();
                expect(favoritedPosts).toBeDefined();
                expect(Array.isArray(favoritedPosts.records)).toBe(true);
                favoritedPosts.records.map(entityItem => {
                    const post = entityItem.entity;
                    expect(post.postId).toBeDefined();
                    expect(post.postContent).toBeDefined();

                    const relProps = entityItem.relProps;
                    expect(relProps).toBeDefined();
                    expect(relProps.favoritedAt).toBeDefined();
                    expect(typeof relProps.favoritedAt).toBe("number");
                });
            });
        });

        describe("given user.getSexuality() called", () => {
            beforeEach(async () => {
                user = await usersRepository.findUserById("5c0f145b-ffad-4881-8ee6-7647c3c1b695");
            });

            it("should return an object with proper props", async () => {
                const sexuality = await user.getSexuality();
                expect(sexuality).toBeDefined();
                expect(sexuality).toHaveProperty("sexualityId");
                expect(sexuality).toHaveProperty("sexualityName");
                expect(sexuality).toHaveProperty("sexualityFlagSvg");
            });
        });

        describe("given user.getGender() called", () => {
            beforeEach(async () => {
                user = await usersRepository.findUserById("5c0f145b-ffad-4881-8ee6-7647c3c1b695");
            });

            it("should return an object with proper props", async () => {
                const gender = await user.getGender();
                expect(gender).toBeDefined();
                expect(gender).toHaveProperty("genderId");
                expect(gender).toHaveProperty("genderName");
                expect(gender).toHaveProperty("genderPronouns");
                expect(gender).toHaveProperty("genderFlagSvg");
            });
        });

        describe("given user.getOpenness() called", () => {
            beforeEach(async () => {
                user = await usersRepository.findUserById("5c0f145b-ffad-4881-8ee6-7647c3c1b695");
            });

            it("should return an object with proper props", async () => {
                const openness = await user.getOpenness();
                expect(openness).toBeDefined();
                expect(openness).toHaveProperty("opennessId");
                expect(openness).toHaveProperty("opennessLevel");
                expect(openness).toHaveProperty("opennessDescription");
            });
        });
    });
});
