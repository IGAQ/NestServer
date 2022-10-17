import { Neo4jConfig } from "../../neo4j/neo4jConfig.interface";
import { Test, TestingModule } from "@nestjs/testing";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../../neo4j/neo4j.constants";
import { createDriver } from "../../neo4j/neo4j.utils";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { PostsRepository } from "../services/postRepository/posts.respository";
import { neo4jCredentials } from "../../common/constants";
import { IPostsRepository } from "../services/postRepository/posts.repository.inerface";
import { Post } from "./post";
import { PostToAwardRelTypes } from "./toAward";

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
					provide: "IPostsRepository",
					useClass: PostsRepository,
				},
			],
		}).compile();

		postsRepository = module.get<PostsRepository>("IPostsRepository");
	});

	it("both postRepository and post should be defined", () => {
		expect(postsRepository).toBeDefined();
	});

	describe("given a post instance", () => {
		beforeAll(async () => {
			post = await postsRepository.findPostById("b73edbf4-ba84-4b11-a91c-e1d8b1366974");
		});

		it("post instance must exist", async () => {
			expect(post).toBeDefined();
		});

		describe("given post.getAwards() called", () => {
			beforeEach(async () => {
				post = await postsRepository.findPostById("b73edbf4-ba84-4b11-a91c-e1d8b1366974");
			});

			it("should return an array", async () => {
				let awards = await post.getAwards();
				expect(Array.isArray(awards)).toBe(true);
			});

			it("should return an array of length 2", async () => {
				let awards = await post.getAwards();
				expect(awards.length).toBe(2);
			});
		});
	});


});