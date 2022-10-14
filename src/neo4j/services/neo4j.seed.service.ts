import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "./neo4j.service";
import { Award, Post, PostTag, PostType } from "../../posts/models";
import { LABELS_DECORATOR_KEY } from "../neo4j.constants";
import { HasAwardProps, PostToAwardRelTypes } from "../../posts/models/toAward";
import { Role, User } from "../../users/models";
import { AuthoredProps, UserToPostRelTypes } from "../../users/models/toPost";
import { PostToPostTypeRelTypes } from "../../posts/models/toPostType";
import { PostToPostTagRelTypes } from "../../posts/models/toTags";
import { PostToSelfRelTypes, RestrictedProps } from "../../posts/models/toSelf";

@Injectable()
export class Neo4jSeedService {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    private postTypeLabel = Reflect.get(PostType, LABELS_DECORATOR_KEY)[0];
    private postTagLabel = Reflect.get(PostTag, LABELS_DECORATOR_KEY)[0];
    private awardLabel = Reflect.get(Award, LABELS_DECORATOR_KEY)[0];
    private postLabel = Reflect.get(Post, LABELS_DECORATOR_KEY)[0];
    private userLabel = Reflect.get(User, LABELS_DECORATOR_KEY)[0];

    public async seed() {
        // Populate post types
        let postTypes = await this.getPostTypes();
        for (let postTypeEntity of postTypes) {
            await this._neo4jService.write(
                `CREATE (n:${this.postTypeLabel}) { 
                postTypeId: $postTypeId,
                postType: $postType
             }`, {
                    postTypeId: postTypeEntity.postTypeId,
                    postType: postTypeEntity.postType
                });
        }

        // Populate post tags
        let postTags = await this.getPostTags();
        for (let postTagEntity of postTags) {
            await this._neo4jService.write(
                `CREATE (n:${this.postTagLabel}) { 
                tagId: $tagId,
                tagName: $tagName
             }`, {
                    tagId: postTagEntity.tagId,
                    tagName: postTagEntity.tagName
                });
        }

        // Populate awards
        let awards = await this.getAwards();
        for (let awardEntity of awards) {
            await this._neo4jService.write(
                `CREATE (n:${this.awardLabel}) { 
                awardId: $awardId,
                awardName: $awardName,
                awardSvg: $awardSvg
             }`, {
                    awardId: awardEntity.awardId,
                    awardName: awardEntity.awardName,
                    awardSvg: awardEntity.awardSvg
                });
        }

        // Populate posts
        let posts = await this.getPosts();
        for (let postEntity of posts) {
            let restrictedQueryString = "";
            let restrictedQueryParams = {};
            if (postEntity.restrictedProps !== null) {
                restrictedQueryString = `-[:${PostToSelfRelTypes.RESTRICTED} { 
                    restrictedAt: $restrictedAt, 
                    moderatorId: $moderatorId,
                    reason: $reason
                 }]->(p)`;
                restrictedQueryParams = {
                    restrictedAt: postEntity.restrictedProps.restrictedAt,
                    moderatorId: postEntity.restrictedProps.moderatorId,
                    reason: postEntity.restrictedProps.reason
                } as RestrictedProps;
            }

            let authoredProps = new AuthoredProps(
                postEntity.authorUser.posts[UserToPostRelTypes.AUTHORED].records
                    .find(record => record.entity.postId === postEntity.postId).relProps
            );
            await this._neo4jService.write(
                `
                MATCH (u:${this.userLabel} { userId: $userId })
                CREATE (p:${this.postLabel}) {
                    postId: $postId,
                    updatedAt: $updatedAt,
                    postTitle: $postTitle,
                    postContent: $postContent,
                    pending: $pending
                })${restrictedQueryString}<-[authoredRelationship:${UserToPostRelTypes.AUTHORED} {
                    authoredAt: $authoredProps_authoredAt,
                    anonymously: $authoredProps_anonymously
                 }]-(u)
                WITH [$withPostTags] AS postTagIDsToBeConnected
                UNWIND postTagIDsToBeConnected as postTagIdToBeConnected
                    MATCH (p1:${this.postLabel}) WHERE p1.postId = $postId
                    MATCH (postTag:${this.postTagLabel}) WHERE postTag.tagId = postTagIdToBeConnected
                        MERGE (p1)-[:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(postType:${this.postTagLabel}) WHERE postType.postTypeId = $postTypeId
                        CREATE (p1)-[:${PostToPostTagRelTypes.HAS_POST_TAG}]->(postTag)
                WITH [$withAwards] AS awardIDsToBeConnected       
                UNWIND awardIDsToBeConnected as awardIdToBeConnected
                    MATCH (p1:${this.postLabel}) WHERE p1.postId = $postId
                    MATCH (award:${this.awardLabel}) WHERE award.awardId = awardIdToBeConnected
                        CREATE (p1)-[:${PostToAwardRelTypes.HAS_AWARD}]->(award)
            `, {
                    // With Clauses
                    withPostTags: postEntity.postTags.map(pt => `"${pt.tagId}"`).join(","),
                    withAwards: postEntity.awards[PostToAwardRelTypes.HAS_AWARD].records.map(record => `"${record.entity.awardId}"`).join(","),

                    // Post Author User
                    userId: postEntity.authorUser.userId,

                    // Post
                    postId: postEntity.postId,
                    updatedAt: postEntity.updatedAt,
                    postTitle: postEntity.postTitle,
                    pending: postEntity.pending,

                    // PostType
                    postTypeId: postEntity.postType.postTypeId,

                    // AuthoredProps
                    authoredProps_authoredAt: authoredProps.authoredAt,
                    authoredProps_anonymously: authoredProps.anonymously,

                    // RestrictedProps (if applicable)
                    ...restrictedQueryParams,
                });
        }
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
                roles: [Role.MODERATOR],
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
                roles: [Role.USER],
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
