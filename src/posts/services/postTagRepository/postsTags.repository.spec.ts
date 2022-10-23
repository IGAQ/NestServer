import { Test, TestingModule } from "@nestjs/testing";
import { IPostTagsRepository } from "./postTags.repository.interface";
import { PostTagsRepository } from "./postTags.repository";
import { PostTag } from "../../models";
import { Neo4jService } from "src/neo4j/services/neo4j.service";
import { Neo4jConfig } from "src/neo4j/neo4jConfig.interface";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../../neo4j/neo4j.constants";
import { createDriver } from "../../../neo4j/neo4j.utils";
import { neo4jCredentials } from "../../../_domain/constants";
import { Neo4jSeedService } from "../../../neo4j/services/neo4j.seed.service";
import { RestrictedProps } from "../../../_domain/models/toSelf";
import { _$ } from "../../../_domain/injectableTokens";

describe("PostTagsRepository", () => {
    let postTagsRepository: IPostTagsRepository;
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
                    provide: _$.IPostTagsRepository,
                    useClass: PostTagsRepository,
                },
            ],
        }).compile();

        postTagsRepository = module.get<PostTagsRepository>(_$.IPostTagsRepository);

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
        expect(postTagsRepository).toBeDefined();
        expect(neo4jSeedService).toBeDefined();
    });

    describe(".findAll()", () => {
        let postTags: PostTag[];

        beforeAll(async () => {
            postTags = await postTagsRepository.findAll();
        });

        it("should return an array of PostTag objects", () => {
            expect(postTags).toBeInstanceOf(Array);
            expect(postTags[0]).toBeInstanceOf(PostTag);
        });

        it("should return an array of PostTag objects with the correct properties", () => {
            const postTag = postTags[0];
            const restrictedProps = new RestrictedProps();
            const postTagProps = Object.keys(postTag);
            const restrictedPropsProps = Object.keys(restrictedProps);

            expect(postTagProps).toEqual(expect.arrayContaining(restrictedPropsProps));
        });
    });

    describe(".getPostTagsByPostId()", () => {
        let postId = "b73edbf4-ba84-4b11-a91c-e1d8b1366974";
        let postTags: PostTag[];

        it("should return an array of PostTag objects", async () => {
            postTags = await postTagsRepository.getPostTagsByPostId(postId);
            expect(postTags).toBeInstanceOf(Array);
            expect(postTags[0]).toBeInstanceOf(PostTag);
        });

        it("should return an array of PostTag objects with the correct properties", async () => {
            postTags = await postTagsRepository.getPostTagsByPostId(postId);
            const postTag = postTags[0];
            const restrictedProps = new RestrictedProps();
            const postTagProps = Object.keys(postTag);
            const restrictedPropsProps = Object.keys(restrictedProps);

            expect(postTagProps).toEqual(expect.arrayContaining(restrictedPropsProps));
        });
    });

    describe(".getPostTagByTagId()", () => {
        let tagId = "b73edbf4-ba84-4b11-a91c-e1d8b1366974";
        let postTag: PostTag;

        it("should return a PostTag object", async () => {
            postTag = await postTagsRepository.getPostTagByTagId(tagId);
            expect(postTag).toBeInstanceOf(PostTag);
        });

        it("should return a PostTag object with the correct properties", async () => {
            postTag = await postTagsRepository.getPostTagByTagId(tagId);
            const restrictedProps = new RestrictedProps();
            const postTagProps = Object.keys(postTag);
            const restrictedPropsProps = Object.keys(restrictedProps);

            expect(postTagProps).toEqual(expect.arrayContaining(restrictedPropsProps));
        });
    });

    describe(".addPostTag() and .deletePostTag()", () => {
        beforeAll(async () => {
            let postTagToAdd = new PostTag({
                tagId: "ff63bf42-3da9-425f-8c7a-b696dd696dfd",
                tagName: "Test",
                tagColor: "pink",
            });
            await postTagsRepository.addPostTag(postTagToAdd);
        });

        it("should add a postTag to the database", async () => {
            let postTag = await postTagsRepository.getPostTagByTagId(
                "ff63bf42-3da9-425f-8c7a-b696dd696dfd"
            );
            expect(postTag).toBeInstanceOf(PostTag);
        });

        afterAll(async () => {
            await postTagsRepository.deletePostTag("ff63bf42-3da9-425f-8c7a-b696dd696dfd");

            let postTag = await postTagsRepository.getPostTagByTagId(
                "ff63bf42-3da9-425f-8c7a-b696dd696dfd"
            );
            expect(postTag).toBeUndefined();
        });
    });
});

