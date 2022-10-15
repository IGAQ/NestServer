import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "./neo4j.service";
import { Award, Post, PostTag, PostType } from "../../posts/models";
import { LABELS_DECORATOR_KEY } from "../neo4j.constants";
import { HasAwardProps, PostToAwardRelTypes } from "../../posts/models/toAward";
import { Gender, Role, Sexuality, User } from "../../users/models";
import { AuthoredProps, UserToPostRelTypes } from "../../users/models/toPost";
import { PostToPostTypeRelTypes } from "../../posts/models/toPostType";
import { PostToPostTagRelTypes } from "../../posts/models/toTags";
import { PostToSelfRelTypes, RestrictedProps } from "../../posts/models/toSelf";
import { UserToSexualityRelTypes } from "../../users/models/toSexuality";
import { UserToGenderRelTypes } from "../../users/models/toGender";

@Injectable()
export class Neo4jSeedService {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    private postTypeLabel = Reflect.get(PostType, LABELS_DECORATOR_KEY)[0];
    private postTagLabel = Reflect.get(PostTag, LABELS_DECORATOR_KEY)[0];
    private awardLabel = Reflect.get(Award, LABELS_DECORATOR_KEY)[0];
    private postLabel = Reflect.get(Post, LABELS_DECORATOR_KEY)[0];
    private sexualityLabel = Reflect.get(Sexuality, LABELS_DECORATOR_KEY)[0];
    private genderLabel = Reflect.get(Gender, LABELS_DECORATOR_KEY)[0];
    private userLabel = Reflect.get(User, LABELS_DECORATOR_KEY)[0];

    public async seed() {
        // Populate post types
        let postTypes = await this.getPostTypes();
        for (let postTypeEntity of postTypes) {
            await this._neo4jService.write(
                `CREATE (n:${this.postTypeLabel} { 
                postTypeId: $postTypeId,
                postType: $postType
             })`,
                {
                    postTypeId: postTypeEntity.postTypeId,
                    postType: postTypeEntity.postType,
                }
            );
        }

        // Populate post tags
        let postTags = await this.getPostTags();
        for (let postTagEntity of postTags) {
            await this._neo4jService.write(
                `CREATE (n:${this.postTagLabel} { 
                tagId: $tagId,
                tagName: $tagName
             })`,
                {
                    tagId: postTagEntity.tagId,
                    tagName: postTagEntity.tagName,
                }
            );
        }

        // Populate awards
        let awards = await this.getAwards();
        for (let awardEntity of awards) {
            await this._neo4jService.write(
                `CREATE (n:${this.awardLabel} { 
                awardId: $awardId,
                awardName: $awardName,
                awardSvg: $awardSvg
             })`,
                {
                    awardId: awardEntity.awardId,
                    awardName: awardEntity.awardName,
                    awardSvg: awardEntity.awardSvg,
                }
            );
        }

        // Populate sexualities
        let sexualities = await this.getSexualities();
        for (let sexualityEntity of sexualities) {
            await this._neo4jService.write(
                `CREATE (n:${this.sexualityLabel} {
                    sexualityId: $sexualityId,
                    sexualityName: $sexualityName,
                    sexualityFlagSvg: $sexualityFlagSvg
                })`,
                {
                    sexualityId: sexualityEntity.sexualityId,
                    sexualityName: sexualityEntity.sexualityName,
                    sexualityFlagSvg: sexualityEntity.sexualityFlagSvg,
                });
        }

        // Populate genders
        let genders = await this.getGenders();
        for (let genderEntity of genders) {
            await this._neo4jService.write(
                `CREATE (n:${this.genderLabel} { 
                genderId: $genderId,
                genderName: $genderName,
                genderPronouns: $genderPronouns,
                genderFlagSvg: $genderFlagSvg
             })`,
                {
                    genderId: genderEntity.genderId,
                    genderName: genderEntity.genderName,
                    genderPronouns: genderEntity.genderPronouns,
                    genderFlagSvg: genderEntity.genderFlagSvg,
                }
            );
        }

        // Populate users
        let users = await this.getUsers();
        for (let userEntity of users) {
            await this._neo4jService.write(
                `
                MATCH (s:${this.sexualityLabel} { sexualityId: $sexualityId })
                MATCH (g:${this.genderLabel} { genderId: $genderId })
                    CREATE (u:${this.userLabel} { 
                        userId: $userId,
                        
                        createdAt: $createdAt,
                        updatedAt: $updatedAt,
                        
                        username: $username,
                        normalizedUsername: $normalizedUsername,
                        
                        passwordHash: $passwordHash,
                        
                        phoneNumber: $phoneNumber,
                        phoneNumberVerified: $phoneNumberVerified,
                        
                        email: $email,
                        emailVerified: $emailVerified,
                        
                        level: $level,
                        
                        roles: $roles
                    })-[:${UserToSexualityRelTypes.HAS_SEXUALITY}]->(s), (u)-[:${UserToGenderRelTypes.HAS_GENDER}]->(g) `,
                {
                    userId: userEntity.userId,
                    createdAt: userEntity.createdAt,
                    updatedAt: userEntity.updatedAt,
                    username: userEntity.username,
                    normalizedUsername: userEntity.normalizedUsername,
                    passwordHash: userEntity.passwordHash,
                    phoneNumber: userEntity.phoneNumber,
                    phoneNumberVerified: userEntity.phoneNumberVerified,
                    email: userEntity.email,
                    emailVerified: userEntity.emailVerified,
                    level: userEntity.level,
                    roles: userEntity.roles,

                    sexualityId: userEntity.sexuality.sexualityId,
                    genderId: userEntity.gender.genderId,
                }
            );
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
                    reason: postEntity.restrictedProps.reason,
                } as RestrictedProps;
            }

            let authoredProps = new AuthoredProps({
                authoredAt: 1665770000,
                anonymously: false,
            });
            await this._neo4jService.write(
                `
                MATCH (u:${this.userLabel} { userId: $userId })
                CREATE (p:${this.postLabel} {
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
                    MATCH (postType:${this.postTypeLabel}) WHERE postType.postTypeId = $postTypeId
                    MATCH (postTag:${this.postTagLabel}) WHERE postTag.tagId = postTagIdToBeConnected
                        MERGE (p1)-[:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(postType)
                        CREATE (p1)-[:${PostToPostTagRelTypes.HAS_POST_TAG}]->(postTag)
                WITH [$withAwards] AS awardIDsToBeConnected       
                UNWIND awardIDsToBeConnected as awardIdToBeConnected
                    MATCH (p1:${this.postLabel}) WHERE p1.postId = $postId
                    MATCH (award:${this.awardLabel}) WHERE award.awardId = awardIdToBeConnected
                        MERGE (p1)-[:${PostToAwardRelTypes.HAS_AWARD}]->(award)
            `,
                {
                    // With Clauses
                    withPostTags: postEntity.postTags.map(pt => `"${pt.tagId}"`).join(","),
                    withAwards: postEntity.awards[PostToAwardRelTypes.HAS_AWARD].records
                        .map(record => `"${record.entity.awardId}"`)
                        .join(","),

                    // Post Author User
                    userId: postEntity.authorUser.userId,

                    // Post
                    postId: postEntity.postId,
                    updatedAt: postEntity.updatedAt,
                    postTitle: postEntity.postTitle,
                    postContent: postEntity.postContent,
                    pending: postEntity.pending,

                    // PostType
                    postTypeId: postEntity.postType.postTypeId,

                    // AuthoredProps
                    authoredProps_authoredAt: authoredProps.authoredAt,
                    authoredProps_anonymously: authoredProps.anonymously,

                    // RestrictedProps (if applicable)
                    ...restrictedQueryParams,
                }
            );
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
                gender: new Gender({
                    genderId: "d2945763-d1fb-46aa-b896-7f701b4ca699",
                }),
                sexuality: new Sexuality({
                    sexualityId: "1b67cf76-752d-4ea5-9584-a4232998b838",
                }),
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
                roles: [Role.USER, Role.MODERATOR],
                gender: new Gender({
                    genderId: "585d31aa-d5b3-4b8d-9690-ffcd57ce2862",
                }),
                sexuality: new Sexuality({
                    sexualityId: "9164d89b-8d71-4fd1-af61-155d1d7ffe53",
                }),
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
                updatedAt: 1665770000,
                postType: (await this.getPostTypes())[0],
                postTags: (await this.getPostTags()).slice(0, 2),
                restrictedProps: null,
                authorUser: new User({
                    userId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                }),
                pending: false,
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
                updatedAt: 1665770000,
                postType: (await this.getPostTypes())[0],
                postTags: (await this.getPostTags()).slice(0, 2),
                restrictedProps: new RestrictedProps({
                    restrictedAt: 1665780000,
                    moderatorId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                    reason: "The moderator thinks there is profanity in this post",
                }),
                authorUser: new User({
                    userId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                }),
                pending: true,
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
                awardName: "Sean's Mom Award",
                awardSvg: "<svg></svg>",
            }),
            new Award({
                awardId: "375608ce-ca65-4293-8402-da34cd2c42c7",
                awardName: "",
                awardSvg: "<svg></svg>",
            })
        );
    }

    private async getSexualities(): Promise<Sexuality[]> {
        return new Array<Sexuality>(
            new Sexuality({
                sexualityId: "9164d89b-8d71-4fd1-af61-155d1d7ffe53",
                sexualityName: "Gay",
                sexualityFlagSvg: "<svg></svg>",
            }),
            new Sexuality({
                sexualityId: "1b67cf76-752d-4ea5-9584-a4232998b838",
                sexualityName: "Lesbian",
                sexualityFlagSvg: "<svg></svg>",
            }),
            new Sexuality({
                sexualityId: "df388311-c184-4f09-93f4-645c6175322c",
                sexualityName: "Homosexual",
                sexualityFlagSvg: "<svg></svg>",
            }),
            new Sexuality({
                sexualityId: "2d32c4d3-4aca-4b03-bf68-ba104656183f",
                sexualityName: "Asexual",
                sexualityFlagSvg: "<svg></svg>",
            })
        );
    }

    private async getGenders(): Promise<Gender[]> {
        return new Array<Gender>(
            new Gender({
                genderId: "d2945763-d1fb-46aa-b896-7f701b4ca699",
                genderName: "Female",
                genderPronouns: "She/Her",
                genderFlagSvg: "<svg></svg>",
            }),
            new Gender({
                genderId: "585d31aa-d5b3-4b8d-9690-ffcd57ce2862",
                genderName: "Male",
                genderPronouns: "He/Him",
                genderFlagSvg: "<svg></svg>",
            }),
            new Gender({
                genderId: "23907da4-c3f2-4e96-a73d-423e64f18a21",
                genderName: "Non-binary",
                genderPronouns: "They/Them",
                genderFlagSvg: "<svg></svg>",
            })
        );
    }
}
