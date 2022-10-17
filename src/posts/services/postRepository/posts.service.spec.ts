import { Test, TestingModule } from "@nestjs/testing";
import { IPostsRepository } from "./posts.repository.inerface";
import { PostsRepository } from "./posts.respository";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Neo4jConfig } from "../../../neo4j/neo4jConfig.interface";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../../neo4j/neo4j.constants";
import { createDriver } from "../../../neo4j/neo4j.utils";
import { neo4jCredentials } from "../../../common/constants";
import { Post } from "../../models";

describe("PostsRepository", () => {
    let postsRepository: IPostsRepository;

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
        let posts: Post[];

        beforeAll(async () => {
            posts = await postsRepository.findAll();
        });

        it("should return an array of posts", async () => {
            console.log(posts);
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

        it("every post has to have its .neo4jService property defined", async () => {
            posts.forEach((post) => {
                expect(post.neo4jService).toBeDefined();
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

        it("should return a post with a .neo4jService property defined", async () => {
            expect(post.neo4jService).toBeDefined();
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
});
