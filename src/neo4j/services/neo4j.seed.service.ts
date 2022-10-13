import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "./neo4j.service";
import { Award, Post, PostTag, PostType } from "../../posts/models";
import { LABELS_DECORATOR_KEY } from "../neo4j.constants";
import { HasAwardProps, PostToAwardRelTypes } from "../../posts/models/toAward";
import { Role, User } from "../../users/models";
import { AuthoredProps, UserToPostRelTypes } from "../../users/models/toPost";

@Injectable()
export class Neo4jSeedService {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    private postTypeLabel = Reflect.get(PostType, LABELS_DECORATOR_KEY)[0];
    private postTagLabel = Reflect.get(PostTag, LABELS_DECORATOR_KEY)[0];
    private awardLabel = Reflect.get(Award, LABELS_DECORATOR_KEY)[0];
    private postLabel = Reflect.get(Post, LABELS_DECORATOR_KEY)[0];

    public async seed() {
        await this._neo4jService.write(``, {});

        await this._neo4jService.write(
            `CREATE (n:${this.postLabel} {name: 'Arthur', title: 'King'}) RETURN n`,
            {}
        );
    }

    public async getUsers(): Promise<User[]> {
        const onlyAuthoredPosts = {
            [UserToPostRelTypes.READ]: {
                records: [],
                relType: UserToPostRelTypes.READ,
            },
            [UserToPostRelTypes.UPVOTES]: {
                records: [],
                relType: UserToPostRelTypes.UPVOTES,
            },
            [UserToPostRelTypes.DOWN_VOTES]: {
                records: [],
                relType: UserToPostRelTypes.DOWN_VOTES,
            },
            [UserToPostRelTypes.FAVORITES]: {
                records: [],
                relType: UserToPostRelTypes.FAVORITES,
            },
        };

        return new Array<User>(
            new User({
                userId: "5c0f145b-ffad-4881-8ee6-7647c3c1b695",
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                username: "alice",
                normalizedUsername: "ALICE",
                passwordHash: "password",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "a@a.com",
                emailVerified: false,
                level: 0,
                role: [Role.MODERATOR],
                posts: {
                    [UserToPostRelTypes.AUTHORED]: {
                        records: (await this.getPosts()).slice(0, 2).map(post => ({
                            entity: post,
                            relProps: new AuthoredProps({
                                authoredAt: new Date("June 1st, 2022").getTime(),
                                anonymously: false,
                            }),
                        })),
                        relType: UserToPostRelTypes.AUTHORED,
                    },
                    ...onlyAuthoredPosts,
                },
            }),
            new User({
                userId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                username: "leo",
                normalizedUsername: "LEO",
                passwordHash: "123",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "b@b.com",
                emailVerified: false,
                level: 0,
                role: [Role.USER],
                posts: {
                    [UserToPostRelTypes.AUTHORED]: {
                        records: (await this.getPosts()).slice(2).map(post => ({
                            entity: post,
                            relProps: new AuthoredProps({
                                authoredAt: new Date("June 1st, 2022").getTime(),
                                anonymously: false,
                            }),
                        })),
                        relType: UserToPostRelTypes.AUTHORED,
                    },
                    ...onlyAuthoredPosts,
                },
            })
        );
    }

    public async getPosts(): Promise<Post[]> {
        return new Array<Post>(
            new Post({
                postId: "b73edbf4-ba84-4b11-a91c-e1d8b1366974",
                postTitle: "Am I Lesbian?",
                postContent: "today I kissed a girl! it felt so good.",
                postType: (await this.getPostTypes())[0],
                postTags: (await this.getPostTags()).slice(0, 2),
                awards: {
                    [PostToAwardRelTypes.HAS_AWARD]: {
                        records: (await this.getAwards()).slice(0, 2).map(award => ({
                            entity: award,
                            relProps: new HasAwardProps({
                                awardedBy: "5c0f145b-ffad-4881-8ee6-7647c3c1b695",
                            }),
                        })),
                        relType: PostToAwardRelTypes.HAS_AWARD,
                    },
                },
            }),
            new Post({
                postId: "596632ac-dd54-4700-a783-688618d99fa9",
                postTitle: "Am I Gay?",
                postContent: "today I kissed a boy! it felt so good.",
                postType: (await this.getPostTypes())[0],
                postTags: (await this.getPostTags()).slice(0, 2),
                awards: {
                    [PostToAwardRelTypes.HAS_AWARD]: {
                        records: (await this.getAwards()).slice(0, 2).map(award => ({
                            entity: award,
                            relProps: new HasAwardProps({
                                awardedBy: "5c0f145b-ffad-4881-8ee6-7647c3c1b695",
                            }),
                        })),
                        relType: PostToAwardRelTypes.HAS_AWARD,
                    },
                },
            })
        );
    }

    private async getPostTypes(): Promise<PostType[]> {
        return new Array<PostType>(
            new PostType({
                postTypeId: "95aaf886-064e-44b3-906f-3a7798945b7b",
                postType: "Queery",
            }),
            new PostType({
                postTypeId: "2677fd94-976b-4c81-8165-55edd038c581",
                postType: "Story",
            })
        );
    }

    private async getPostTags(): Promise<PostTag[]> {
        return new Array<PostTag>(
            new PostTag({
                tagId: "39b90340-82b7-4149-8f5d-40b00a61d2a2",
                tagName: "serious",
            }),
            new PostTag({
                tagId: "ee741539-151e-4fcd-91ce-8d4599a15cdf",
                tagName: "advice",
            }),
            new PostTag({
                tagId: "edf6897b-610d-4c03-8d25-791d47ca663b",
                tagName: "vent",
            })
        );
    }

    private async getAwards(): Promise<Award[]> {
        return new Array<Award>(
            new Award({
                awardId: "2049221e-1f45-4430-8edc-95db808db072",
                awardName: "",
                awardSvg: "<svg></svg>",
            }),
            new Award({
                awardId: "375608ce-ca65-4293-8402-da34cd2c42c7",
                awardName: "",
                awardSvg: "<svg></svg>",
            })
        );
    }
}
