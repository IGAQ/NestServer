import { Test, TestingModule } from "@nestjs/testing";
import { IPostsRepository } from "./posts.repository.interface";
import { PostsRepository } from "./posts.repository";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Neo4jConfig } from "../../../neo4j/neo4jConfig.interface";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../../neo4j/neo4j.constants";
import { createDriver } from "../../../neo4j/neo4j.utils";
import { neo4jCredentials } from "../../../_domain/constants";
import { Post } from "../../models";
import { User } from "../../../users/models";
import { HasAwardProps, PostToAwardRelTypes } from "../../models/toAward";
import { Neo4jSeedService } from "../../../neo4j/services/neo4j.seed.service";
import { RestrictedProps } from "../../../_domain/models/toSelf";
import { _$ } from "../../../_domain/injectableTokens";

describe("PostsRepository", () => {
    let postsRepository: IPostsRepository;
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
                    provide: _$.IPostsRepository,
                    useClass: PostsRepository,
                },
            ],
        }).compile();

        postsRepository = module.get<PostsRepository>(_$.IPostsRepository);

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
        expect(postsRepository).toBeDefined();
        expect(neo4jSeedService).toBeDefined();
    });

    describe(".findAll()", () => {
        let posts: Post[];

        beforeAll(async () => {
            posts = await postsRepository.findAll();
        });

        it("should return an array of posts", async () => {
            expect(Array.isArray(posts)).toBe(true);
        });

        it("should return an array of posts with a length equal or greater than 0", async () => {
            expect(posts.length).toBeGreaterThanOrEqual(0);
        });

        it("every post has to only have the Node properties at the beginning", async () => {
            posts.forEach(post => {
                expect(post.awards).toBeUndefined();
                expect(post.postTags.length).toBe(0);
                expect(post.postType).toBeUndefined();
                expect(post.authorUser).toBeUndefined();
                expect(post.createdAt).toBeUndefined();
                expect(post.restrictedProps).toBeNull();
            });
        });
    });

    describe(".findPostById()", () => {
        let post: Post;

        beforeAll(async () => {
            post = await postsRepository.findPostById("bcddeb57-939d-441b-b4ea-71e1d2055f32");
        });

        it("should return a post", async () => {
            expect(post).toBeDefined();
        });

        it("post has to only have the Node properties at the beginning", async () => {
            expect(post.awards).toBeUndefined();
            expect(post.postTags.length).toBe(0);
            expect(post.postType).toBeUndefined();
            expect(post.authorUser).toBeUndefined();
            expect(post.createdAt).toBeUndefined();
            expect(post.restrictedProps).toBeNull();
        });
    });

    describe(".addPost() and .deletePost()", () => {
        const samplePostId = "64f5ef93-31ac-4c61-b98a-79268d282fc7";
        const sampleAuthorId = "a59437f4-ea62-4a15-a4e6-621b04af74d6";
        const sampleAwardedByUserId = "0daef999-7291-4f0c-a41a-078a6f28aa5e";
        beforeAll(async () => {
            const postTags = await neo4jSeedService.getPostTags();
            const postToAdd = new Post({
                postId: samplePostId,
                postTitle: "Test Post Title",
                postContent: "This is a test post. will be removed",
                updatedAt: new Date("2020-05-20").getTime(),
                postType: (await neo4jSeedService.getPostTypes()).queery,
                postTags: [postTags.Serious, postTags.Casual],
                restrictedProps: null,
                authorUser: new User({ userId: sampleAuthorId }),
                pending: false,
                awards: {
                    [PostToAwardRelTypes.HAS_AWARD]: {
                        records: (await neo4jSeedService.getAwards()).slice(0, 2).map(award => ({
                            entity: award,
                            relProps: new HasAwardProps({ awardedBy: sampleAwardedByUserId }),
                        })),
                        relType: PostToAwardRelTypes.HAS_AWARD,
                    },
                },
            });

            await postsRepository.addPost(postToAdd, false);
        });

        it("should add a post", async () => {
            const post = await postsRepository.findPostById(samplePostId);
            expect(post).toBeDefined();
        });

        afterAll(async () => {
            await postsRepository.deletePost(samplePostId);

            setTimeout(async () => {
                const post = await postsRepository.findPostById(samplePostId);
                expect(post).toBeUndefined();
            }, 4000);
        });
    });

    describe(".restrictPost() and .unrestrictPost()", () => {
        let post: Post;
        const postId = "bcddeb57-939d-441b-b4ea-71e1d2055f32";

        beforeAll(async () => {
            await postsRepository.restrictPost(
                postId,
                new RestrictedProps({
                    restrictedAt: new Date().getTime(),
                    moderatorId: "0daef999-7291-4f0c-a41a-078a6f28aa5e",
                    reason: "Test",
                })
            );
            post = await postsRepository.findPostById(postId);
        });

        it("should restrict a post", async () => {
            const restrictedProps = await post.getRestricted();
            expect(restrictedProps).toBeDefined();
            expect(restrictedProps).not.toBeNull();
        });

        afterAll(async () => {
            await postsRepository.unrestrictPost(postId);
            post = await postsRepository.findPostById(postId);
            const restrictedProps = await post.getRestricted();
            expect(restrictedProps).toBeNull();
        });
    });
});
