import { Test, TestingModule } from "@nestjs/testing";
import { IPostsRepository } from "./posts.repository.inerface";
import { PostsRepository } from "./posts.respository";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Neo4jConfig } from "../../../neo4j/neo4jConfig.interface";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../../neo4j/neo4j.constants";
import { createDriver } from "../../../neo4j/neo4j.utils";
import { neo4jCredentials } from "../../../common/constants";
import { Post } from "../../models";
import { User } from "../../../users/models";
import { HasAwardProps, PostToAwardRelTypes } from "../../models/toAward";
import { Neo4jSeedService } from "../../../neo4j/services/neo4j.seed.service";
import { RestrictedProps } from "../../../common/models/toSelf";

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
                    provide: "IPostsRepository",
                    useClass: PostsRepository,
                },
            ],
        }).compile();

        postsRepository = module.get<PostsRepository>("IPostsRepository");

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
            posts.forEach((post) => {
                expect(post.awards).toBeUndefined();
                expect(post.postTags.length).toBe(0);
                expect(post.postType).toBeUndefined();
                expect(post.authorUser).toBeUndefined();
                expect(post.createdAt).toBeUndefined();
                expect(post.restrictedProps).toBeUndefined();
            });
        });
    });

    describe(".findPostById()", () => {
        let post: Post;

        beforeAll(async () => {
            post = await postsRepository.findPostById("b73edbf4-ba84-4b11-a91c-e1d8b1366974");
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
            expect(post.restrictedProps).toBeUndefined();
        });
    });

    describe(".addPost() and .deletePost()", () => {
        beforeAll(async () => {
            let postToAdd = new Post({
                postId: "64f5ef93-31ac-4c61-b98a-79268d282fc7",
                postTitle: "Test Post Title",
                postContent: "This is a test post. will be removed",
                updatedAt: 1665770000,
                postType: (await neo4jSeedService.getPostTypes())[0],
                postTags: (await neo4jSeedService.getPostTags()).slice(0, 2),
                restrictedProps: null,
                authorUser: new User({
                    userId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                }),
                pending: false,
                awards: {
                    [PostToAwardRelTypes.HAS_AWARD]: {
                        records: (await neo4jSeedService.getAwards()).slice(0, 2).map(award => ({
                            entity: award,
                            relProps: new HasAwardProps({
                                awardedBy: "5c0f145b-ffad-4881-8ee6-7647c3c1b695",
                            }),
                        })),
                        relType: PostToAwardRelTypes.HAS_AWARD,
                    },
                },
            });

            await postsRepository.addPost(postToAdd, false);
        });

        it("should add a post", async () => {
            let post = await postsRepository.findPostById("64f5ef93-31ac-4c61-b98a-79268d282fc7");
            expect(post).toBeDefined();
        });

        afterAll(async () => {
            await postsRepository.deletePost("64f5ef93-31ac-4c61-b98a-79268d282fc7");

            let post = await postsRepository.findPostById("64f5ef93-31ac-4c61-b98a-79268d282fc7");
            expect(post).toBeUndefined();
        });
    });

    describe(".restrictPost() and .unrestrictPost()", () => {
        let post: Post;
        let postId = "b73edbf4-ba84-4b11-a91c-e1d8b1366974";

        beforeAll(async () => {
            await postsRepository.restrictPost(postId, new RestrictedProps({
                restrictedAt: new Date().getTime(),
                moderatorId: "5c0f145b-ffad-4881-8ee6-7647c3c1b695",
                reason: "Test",
            }));
            post = await postsRepository.findPostById(postId);
        });

        it("should restrict a post", async () => {
            let restrictedProps = await post.getRestricted();
            expect(restrictedProps).toBeDefined();
            expect(restrictedProps).not.toBeNull();
        });

        afterAll(async () => {
            await postsRepository.unrestrictPost(postId);
            post = await postsRepository.findPostById(postId);
            let restrictedProps = await post.getRestricted();
            expect(restrictedProps).toBeNull();
        });
    });
});
