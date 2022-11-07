import { Test, TestingModule } from "@nestjs/testing";
import { IPostTypesRepository } from "./postTypes.repository.interface";
import { PostTypesRepository } from "./postTypes.repository";
import { PostType } from "../../models";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Neo4jConfig } from "../../../neo4j/neo4jConfig.interface";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../../neo4j/neo4j.constants";
import { createDriver } from "../../../neo4j/neo4j.utils";
import { neo4jCredentials } from "../../../_domain/constants";
import { Neo4jSeedService } from "../../../neo4j/services/neo4j.seed.service";
import { RestrictedProps } from "../../../_domain/models/toSelf";
import { _$ } from "../../../_domain/injectableTokens";

describe("PostTypesRepository", () => {
    let postTypesRepository: IPostTypesRepository;
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
                    provide: _$.IPostTypesRepository,
                    useClass: PostTypesRepository,
                },
            ],
        }).compile();

        postTypesRepository = module.get<PostTypesRepository>(_$.IPostTypesRepository);

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
        expect(postTypesRepository).toBeDefined();
        expect(neo4jSeedService).toBeDefined();
    });

    describe(".findAll()", () => {
        let postTypes: PostType[];

        beforeAll(async () => {
            postTypes = await postTypesRepository.findAll();
        });

        it("should return an array of PostType objects", () => {
            expect(postTypes).toBeInstanceOf(Array);
            expect(postTypes[0]).toBeInstanceOf(PostType);
        });

        it("should return an array of PostType objects with the correct properties", () => {
            const postType = postTypes[0];
            const restrictedProps = new RestrictedProps();
            const postTypeProps = Object.keys(postType);
            const restrictedPropsKeys = Object.keys(restrictedProps);

            expect(postTypeProps).toEqual(expect.arrayContaining(restrictedPropsKeys));
        });
    });

    describe(".findPostTypeById()", () => {
        let postType: PostType | undefined;

        beforeAll(async () => {
            postType = await postTypesRepository.findPostTypeByName("story");
        });

        it("should return the story post type", () => {
            expect(postType).toBeInstanceOf(PostType);
            expect(postType?.postTypeName).toBe("story");
        });

        it("should return a PostType object", () => {
            expect(postType).toBeInstanceOf(PostType);
        });

        it("should return a PostType object with the correct properties", () => {
            const postTypeProps = Object.keys(postType);
            const correctProps = ["postTypeName"];

            correctProps.forEach(prop => {
                expect(postTypeProps).toContain(prop);
            });
        });
    });
});
