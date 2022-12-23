import { Neo4jConfig } from "../../neo4j/neo4jConfig.interface";
import { Test, TestingModule } from "@nestjs/testing";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../neo4j/neo4j.constants";
import { createDriver } from "../../neo4j/neo4j.utils";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { PostsRepository } from "../repositories/post/posts.repository";
import { neo4jCredentials } from "../../_domain/constants";
import { IPostsRepository } from "../repositories/post/posts.repository.interface";
import { Post } from "./post";
import { _$ } from "../../_domain/injectableTokens";

const postIdToFindInTest = "bcddeb57-939d-441b-b4ea-71e1d2055f32";

describe("Post Model Unit Test", () => {
    let postsRepository: IPostsRepository;

    let post: Post;

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
                    provide: _$.IPostsRepository,
                    useClass: PostsRepository,
                },
            ],
        }).compile();

        postsRepository = module.get<PostsRepository>(_$.IPostsRepository);
    });

    it("should be defined", () => {
        expect(postsRepository).toBeDefined();
    });

    describe("given a post instance", () => {
        beforeAll(async () => {
            post = await postsRepository.findPostById(postIdToFindInTest);
        });

        it("post instance must exist", async () => {
            expect(post).toBeDefined();
        });

        describe("given post.getAwards() called", () => {
            beforeAll(async () => {
                await post.getAwards();
            });

            it("should return an array", async () => {
                expect(Array.isArray(post.awards.HAS_AWARD.records)).toBe(true);
            });

            it("should return an array of length 2", async () => {
                expect(post.awards.HAS_AWARD.records.length).toBe(2);
            });
        });

        describe("given post.getRestricted() called", () => {
            describe("given the post is not restricted", () => {
                beforeEach(async () => {
                    post = await postsRepository.findPostById(postIdToFindInTest);
                });

                it("should return null", async () => {
                    const restrictedProps = await post.getRestricted();
                    expect(restrictedProps).toBeNull();
                });
            });

            describe("given the post is restricted", () => {
                beforeEach(async () => {
                    post = await postsRepository.findPostById(postIdToFindInTest);
                });

                it("should return an object consisting the proper props", async () => {
                    const restrictedProps = await post.getRestricted();
                    expect(typeof restrictedProps).toBe("object");
                    expect(restrictedProps).toHaveProperty("restrictedAt");
                    expect(restrictedProps).toHaveProperty("moderatorId");
                    expect(restrictedProps).toHaveProperty("reason");
                });
            });
        });

        describe("given post.getAuthorUser() called", () => {
            beforeEach(async () => {
                post = await postsRepository.findPostById(postIdToFindInTest);
            });

            it("should return an object consisting the proper props", async () => {
                const authorUser = await post.getAuthorUser();
                expect(typeof authorUser).toBe("object");
                expect(authorUser).toHaveProperty("userId");
                expect(authorUser).toHaveProperty("createdAt");
                expect(authorUser).toHaveProperty("updatedAt");
                expect(authorUser).toHaveProperty("email");
                expect(authorUser).toHaveProperty("emailVerified");
                expect(authorUser).toHaveProperty("username");
                expect(authorUser).toHaveProperty("normalizedUsername");
                expect(authorUser).toHaveProperty("passwordHash");
                expect(authorUser).toHaveProperty("level");
            });
        });

        describe("given post.getCreatedAt() called", () => {
            beforeEach(async () => {
                post = await postsRepository.findPostById(postIdToFindInTest);
            });

            it("should return a number that represents timestamp", async () => {
                const createdAt = await post.getCreatedAt();
                expect(typeof createdAt).toBe("number");
            });
        });

        describe("given post.getPostType() called", () => {
            beforeEach(async () => {
                post = await postsRepository.findPostById(postIdToFindInTest);
            });

            it("should return an object with proper properties", async () => {
                const postType = await post.getPostType();
                expect(typeof postType).toBe("object");
                expect(postType).toHaveProperty("postTypeName");
            });
        });

        describe("given post.getPostTags() called", () => {
            beforeEach(async () => {
                post = await postsRepository.findPostById(postIdToFindInTest);
            });

            it("should return an array that consists valid objects with proper props", async () => {
                const postTags = await post.getPostTags();
                expect(Array.isArray(postTags)).toBe(true);
                postTags.forEach(postTag => {
                    expect(typeof postTag).toBe("object");
                    expect(postTag).toHaveProperty("tagName");
                });
            });
        });
    });
});
