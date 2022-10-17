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
import { User } from "../../users/models";

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

		describe("given post.getRestricted() called", () => {
			describe("given the post is not restricted", () => {
				beforeEach(async () => {
					post = await postsRepository.findPostById("b73edbf4-ba84-4b11-a91c-e1d8b1366974");
				});

				it("should return null", async () => {
					let restrictedProps = await post.getRestricted();
					expect(restrictedProps).toBeNull();
				});
			});

			describe("given the post is restricted", () => {
				beforeEach(async () => {
					post = await postsRepository.findPostById("596632ac-dd54-4700-a783-688618d99fa9");
				});

				it("should return an object consisting the proper props", async () => {
					let restrictedProps = await post.getRestricted();
					expect(typeof restrictedProps).toBe("object");
					expect(restrictedProps).toHaveProperty("restrictedAt");
					expect(restrictedProps).toHaveProperty("moderatorId");
					expect(restrictedProps).toHaveProperty("reason");
				});
			});
		});

		describe("given post.getAuthorUser() called", () => {
			beforeEach(async () => {
				post = await postsRepository.findPostById("b73edbf4-ba84-4b11-a91c-e1d8b1366974");
			});

			it("should return an object consisting the proper props", async () => {
				let authorUser = await post.getAuthorUser();
				expect(typeof authorUser).toBe("object");
				expect(authorUser).toHaveProperty("userId");
				expect(authorUser).toHaveProperty("createdAt");
				expect(authorUser).toHaveProperty("updatedAt");
				expect(authorUser).toHaveProperty("avatar");
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
				post = await postsRepository.findPostById("b73edbf4-ba84-4b11-a91c-e1d8b1366974");
			});

			it("should return a number that represents timestamp", async () => {
				let createdAt = await post.getCreatedAt();
				expect(typeof createdAt).toBe("number");
			});
		});

		describe("given post.getPostType() called", () => {
			beforeEach(async () => {
				post = await postsRepository.findPostById("b73edbf4-ba84-4b11-a91c-e1d8b1366974");
			});

			it("should return an object with proper properties", async () => {
				let postType = await post.getPostType();
				expect(typeof postType).toBe("object");
				expect(postType).toHaveProperty("postTypeId");
				expect(postType).toHaveProperty("postType");
			});
		});

		describe("given post.getPostTags() called", () => {
			beforeEach(async () => {
				post = await postsRepository.findPostById("b73edbf4-ba84-4b11-a91c-e1d8b1366974");
			});

			it("should return an array that consists valid objects with proper props", async () => {
				let postTags = await post.getPostTags();
				expect(Array.isArray(postTags)).toBe(true);
				postTags.forEach((postTag) => {
					expect(typeof postTag).toBe("object");
					expect(postTag).toHaveProperty("tagId");
					expect(postTag).toHaveProperty("tagName");
				});
			});
		});
	});


});