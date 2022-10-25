import { Test, TestingModule } from "@nestjs/testing";
import { IPostTagsRepository } from "./postTags.repository.interface";
import { PostTagsRepository } from "./postTags.repository";
import { PostTag } from "../../models";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Neo4jConfig } from "../../../neo4j/neo4jConfig.interface";
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
            const postType = postTags[0];
            const restrictedProps = new RestrictedProps();
            const postTypeProps = Object.keys(postType);
            const restrictedPropsKeys = Object.keys(restrictedProps);

            expect(postTypeProps).toEqual(expect.arrayContaining(restrictedPropsKeys));
        });
    });

    describe(".getPostTagByTagId()", () => {
        let postTag: PostTag;

        beforeAll(async () => {
            postTag = await postTagsRepository.getPostTagByTagId(
                "59c4221f-f2bb-4a0c-afb4-cc239228ff22"
            );
        });

        it("should return a PostTag object", () => {
            expect(postTag).toBeInstanceOf(PostTag);
        });

        it("should return the gay tag", () => {
            expect(postTag.tagName).toEqual("Gay");
        });

        it("should return a PostTag object with the correct properties", () => {
            const restrictedProps = new RestrictedProps();
            const postTypeProps = Object.keys(postTag);
            const restrictedPropsKeys = Object.keys(restrictedProps);

            expect(postTypeProps).toEqual(expect.arrayContaining(restrictedPropsKeys));
        });
    });
});

