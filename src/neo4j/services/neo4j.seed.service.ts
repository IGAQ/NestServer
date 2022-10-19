import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "./neo4j.service";
import { Award, Post, PostTag, PostType } from "../../posts/models";
import { LABELS_DECORATOR_KEY } from "../neo4j.constants";
import { HasAwardProps, PostToAwardRelTypes } from "../../posts/models/toAward";
import { Gender, Role, Sexuality, User, Openness } from "../../users/models";
import { AuthoredProps, UserToPostRelTypes } from "../../users/models/toPost";
import { PostToPostTypeRelTypes } from "../../posts/models/toPostType";
import { PostToPostTagRelTypes } from "../../posts/models/toTags";
import { _ToSelfRelTypes, RestrictedProps } from "../../_domain/models/toSelf";
import { UserToSexualityRelTypes } from "../../users/models/toSexuality";
import { UserToGenderRelTypes } from "../../users/models/toGender";
import { Comment } from "../../comments/models";
import { CommentToSelfRelTypes } from "../../comments/models/toSelf";
import { PostToCommentRelTypes } from "../../posts/models/toComment";
import { UserToOpennessRelTypes } from "../../users/models/toOpenness";

@Injectable()
export class Neo4jSeedService {
    constructor(@Inject(Neo4jService) private _neo4jService: Neo4jService) {}

    private postTypeLabel = Reflect.get(PostType, LABELS_DECORATOR_KEY)[0];
    private postTagLabel = Reflect.get(PostTag, LABELS_DECORATOR_KEY)[0];
    private awardLabel = Reflect.get(Award, LABELS_DECORATOR_KEY)[0];
    private postLabel = Reflect.get(Post, LABELS_DECORATOR_KEY)[0];
    private commentLabel = Reflect.get(Comment, LABELS_DECORATOR_KEY)[0];
    private sexualityLabel = Reflect.get(Sexuality, LABELS_DECORATOR_KEY)[0];
    private genderLabel = Reflect.get(Gender, LABELS_DECORATOR_KEY)[0];
    private userLabel = Reflect.get(User, LABELS_DECORATOR_KEY)[0];
    private opennessLabel = Reflect.get(Openness, LABELS_DECORATOR_KEY)[0];

    public async seed() {
        // Constraints

        // Post - Post.postId IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT post_postId_UNIQUE FOR (post:${this.postLabel}) REQUIRE post.postId IS UNIQUE`,
            {}
        );
        // Comment - Comment.commentId IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT comment_commentId_UNIQUE FOR (comment:${this.commentLabel}) REQUIRE comment.commentId IS UNIQUE`,
            {}
        );
        // Openness - Openness.opennessId IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT openness_opennessId_UNIQUE FOR (openness:${this.opennessLabel}) REQUIRE openness.opennessId IS UNIQUE`,
            {}
        );
        // PostType - PostType.postTypeId IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT postType_postTypeId_UNIQUE FOR (postType:${this.postTypeLabel}) REQUIRE postType.postTypeId IS UNIQUE`,
            {}
        );
        // PostTag - PostTag.tagId IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT postTag_tagId_UNIQUE FOR (postTag:${this.postTagLabel}) REQUIRE postTag.tagId IS UNIQUE`,
            {}
        );
        // Award - Award.awardId IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT award_awardId_UNIQUE FOR (award:${this.awardLabel}) REQUIRE award.awardId IS UNIQUE`,
            {}
        );
        // Sexuality - Sexuality.sexualityId IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT sexuality_sexualityId_UNIQUE FOR (sexuality:${this.sexualityLabel}) REQUIRE sexuality.sexualityId IS UNIQUE`,
            {}
        );
        // Gender - Gender.genderId IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT gender FOR (gender:${this.genderLabel}) REQUIRE gender.genderId IS UNIQUE`,
            {}
        );
        // User - User.userId IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT user_userId_UNIQUE FOR (user:${this.userLabel}) REQUIRE user.userId IS UNIQUE`,
            {}
        );

        // Populate post types
        const postTypes = await this.getPostTypes();
        for (const postTypeEntity of postTypes) {
            await this._neo4jService.tryWriteAsync(
                `CREATE (n:${this.postTypeLabel} { 
                postTypeId: $postTypeId,
                postType: $postType
             })`,
                postTypeEntity
            );
        }

        // Populate post tags
        const postTags = await this.getPostTags();
        for (const postTagEntity of postTags) {
            await this._neo4jService.tryWriteAsync(
                `CREATE (n:${this.postTagLabel} { 
                tagId: $tagId,
                tagName: $tagName,
                tagColor: $tagColor
             })`,
                postTagEntity
            );
        }

        // Populate awards
        const awards = await this.getAwards();
        for (const awardEntity of awards) {
            await this._neo4jService.tryWriteAsync(
                `CREATE (n:${this.awardLabel} { 
                awardId: $awardId,
                awardName: $awardName,
                awardSvg: $awardSvg
             })`,
                awardEntity
            );
        }

        // Populate sexualities
        const sexualities = await this.getSexualities();
        for (const sexualityEntity of sexualities) {
            await this._neo4jService.tryWriteAsync(
                `CREATE (n:${this.sexualityLabel} {
                    sexualityId: $sexualityId,
                    sexualityName: $sexualityName,
                    sexualityFlagSvg: $sexualityFlagSvg
                })`,
                sexualityEntity
            );
        }

        // Populate genders
        const genders = await this.getGenders();
        for (const genderEntity of genders) {
            await this._neo4jService.tryWriteAsync(
                `CREATE (n:${this.genderLabel} { 
                genderId: $genderId,
                genderName: $genderName,
                genderPronouns: $genderPronouns,
                genderFlagSvg: $genderFlagSvg
             })`,
                genderEntity
            );
        }

        // Populate genders
        const opennessRecords = await this.getOpennessRecords();
        for (const opennessEntity of opennessRecords) {
            await this._neo4jService.tryWriteAsync(
                `CREATE (n:${this.opennessLabel} { 
                opennessId: $opennessId,
                opennessLevel: $opennessLevel,
                opennessDescription: $opennessDescription
             })`,
                opennessEntity
            );
        }

        // Populate users
        const users = await this.getUsers();
        for (const userEntity of users) {
            await this._neo4jService.tryWriteAsync(
                `
                MATCH (s:${this.sexualityLabel} { sexualityId: $sexualityId })
                MATCH (g:${this.genderLabel} { genderId: $genderId })
                MATCH (o:${this.opennessLabel} { opennessId: $opennessId })
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
                    })-[:${UserToSexualityRelTypes.HAS_SEXUALITY}]->(s), 
                        (u)-[:${UserToGenderRelTypes.HAS_GENDER}]->(g),
                        (u)-[:${UserToOpennessRelTypes.HAS_OPENNESS_LEVEL_OF}]->(o)`,
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
                    opennessId: userEntity.openness.opennessId,
                }
            );
        }

        // Populate posts
        const posts = await this.getPosts();

        const votesUserIds = [
            "5c0f145b-ffad-4881-8ee6-7647c3c1b695",
            "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
        ];

        for (const postEntity of posts) {
            let restrictedQueryString = "";
            let restrictedQueryParams = {};
            if (postEntity.restrictedProps !== null) {
                restrictedQueryString = `-[:${_ToSelfRelTypes.RESTRICTED} { 
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

            const authoredProps = new AuthoredProps({
                authoredAt: 1665770000,
                anonymously: false,
            });
            await this._neo4jService.tryWriteAsync(
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
                WITH [${postEntity.postTags
                    .map(pt => `"${pt.tagId}"`)
                    .join(",")}] AS postTagIDsToBeConnected
                UNWIND postTagIDsToBeConnected as postTagIdToBeConnected
                    MATCH (p1:${this.postLabel}) WHERE p1.postId = $postId
                    MATCH (postType:${this.postTypeLabel}) WHERE postType.postTypeId = $postTypeId
                    MATCH (postTag:${
                        this.postTagLabel
                    }) WHERE postTag.tagId = postTagIdToBeConnected
                        MERGE (p1)-[:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(postType)
                        MERGE (p1)-[:${PostToPostTagRelTypes.HAS_POST_TAG}]->(postTag)
                WITH [${postEntity.awards[PostToAwardRelTypes.HAS_AWARD].records
                    .map(record => `"${record.entity.awardId}"`)
                    .join(",")}] AS awardIDsToBeConnected       
                UNWIND awardIDsToBeConnected as awardIdToBeConnected
                    MATCH (p1:${this.postLabel}) WHERE p1.postId = $postId
                    MATCH (award:${this.awardLabel}) WHERE award.awardId = awardIdToBeConnected
                        MERGE (p1)-[:${PostToAwardRelTypes.HAS_AWARD} { awardedBy: "${
                    (
                        postEntity.awards[PostToAwardRelTypes.HAS_AWARD].records[0]
                            .relProps as HasAwardProps
                    ).awardedBy
                }" } ]->(award)
                WITH [${votesUserIds
                    .map(voterUserId => `"${voterUserId}"`)
                    .join(",")}] AS voterUserIdsToBeConnected
                UNWIND voterUserIdsToBeConnected as voterUserIdToBeConnected
                    MATCH (p1:${this.postLabel}) WHERE p1.postId = $postId
                    MATCH (u1:${this.userLabel}) WHERE u1.userId = voterUserIdToBeConnected
                        MERGE (u1)-[:${UserToPostRelTypes.UPVOTES}]->(p1)
            `,
                {
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

        const populateCommentEntity = async commentEntity => {
            let restrictedQueryString = "";
            let restrictedQueryParams = {};
            if (commentEntity.restrictedProps !== null) {
                restrictedQueryString = `-[:${_ToSelfRelTypes.RESTRICTED} { 
                    restrictedAt: $restrictedAt, 
                    moderatorId: $moderatorId,
                    reason: $reason
                 }]->(comment)`;
                restrictedQueryParams = {
                    restrictedAt: commentEntity.restrictedProps.restrictedAt,
                    moderatorId: commentEntity.restrictedProps.moderatorId,
                    reason: commentEntity.restrictedProps.reason,
                } as RestrictedProps;
            }
            const authoredProps = new AuthoredProps({
                authoredAt: commentEntity.createdAt,
                anonymously: false,
            });
            await this._neo4jService.tryWriteAsync(
                `MATCH (authorUser:${this.userLabel}) WHERE authorUser.userId = $authorUserId
                CREATE (comment:${this.commentLabel} {
                    commentId: $commentId,
                    commentContent: $commentContent,
                    updatedAt: $updatedAt,
                    pending: $pending
                })${restrictedQueryString}<-[authoredRelationship:${UserToPostRelTypes.AUTHORED} {
                    authoredAt: $authoredProps_authoredAt,
                    anonymously: $authoredProps_anonymously
                 }]-(authorUser)
                `,
                {
                    // Comment Author User
                    authorUserId: commentEntity.authorUser.userId,

                    // Comment
                    commentId: commentEntity.commentId,
                    commentContent: commentEntity.commentContent,
                    updatedAt: commentEntity.updatedAt,
                    pending: commentEntity.pending,

                    // AuthoredProps
                    authoredProps_authoredAt: authoredProps.authoredAt,
                    authoredProps_anonymously: authoredProps.anonymously,

                    // RestrictedProps (if applicable)
                    ...restrictedQueryParams,
                }
            );

            if (commentEntity.parentId !== null) {
                await this._neo4jService.tryWriteAsync(
                    `MATCH (comment:${this.commentLabel} { commentId: $commentId })
					MATCH (parent) WHERE (parent:${this.postLabel} AND parent.postId = $parentId) OR (parent:${this.commentLabel} AND parent.commentId = $parentId)
					FOREACH (i in CASE WHEN parent:${this.postLabel} THEN [1] ELSE [] END | 
					    MERGE (comment)<-[:${PostToCommentRelTypes.HAS_COMMENT}]-(parent))
					FOREACH (i in CASE WHEN parent:${this.commentLabel} THEN [1] ELSE [] END |
					    MERGE (comment)-[:${CommentToSelfRelTypes.REPLIED}]->(parent))
					`,
                    {
                        commentId: commentEntity.commentId,
                        parentId: commentEntity.parentId,
                    }
                );

                if (commentEntity.pinned) {
                    await this._neo4jService.tryWriteAsync(
                        `MATCH (comment:${this.commentLabel} { commentId: $commentId })
                        MATCH (parent) WHERE parent:${this.postLabel} AND parent.postId = $parentId
                        MERGE (comment)-[:${PostToCommentRelTypes.PINNED_COMMENT}]->(parent)
                        `,
                        {
                            commentId: commentEntity.commentId,
                            parentId: commentEntity.parentId,
                        }
                    );
                }
            }

            for (const childCommentEntity of commentEntity.childComments) {
                await populateCommentEntity(childCommentEntity);
            }
        };

        // Populate comments
        const comments = await this.getComments();
        for (const commentEntity of comments) {
            await populateCommentEntity(commentEntity);
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
                avatar: ":^)",
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
                openness: new Openness({
                    opennessId: "d5c97584-cd1b-4aa6-82ad-b5ddd3577bee",
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
                avatar: "^_^",
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
                openness: new Openness({
                    opennessId: "ae90b960-5f00-4298-b509-fac92a59b406",
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
            }),
            new User({
                userId: "8f0c1ecf-6853-4642-9199-6e8244b89312",
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                avatar: "🤠",
                username: "ilia",
                normalizedUsername: "ILIA",
                passwordHash: "$2b$10$nBR48Qq3e27FWfO3Yxezseaz7GRDe9qo4wXnwT7XoaDnCx9.Id7x6",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "b@b.com",
                emailVerified: true,
                level: 3,
                roles: [Role.ADMIN, Role.MODERATOR],
                gender: new Gender({
                    genderId: "585d31aa-d5b3-4b8d-9690-ffcd57ce2862",
                }),
                sexuality: new Sexuality({
                    sexualityId: "9164d89b-8d71-4fd1-af61-155d1d7ffe53",
                }),
                openness: new Openness({
                    opennessId: "ae90b960-5f00-4298-b509-fac92a59b406",
                }),
                posts: {
                    [UserToPostRelTypes.AUTHORED]: {
                        records: [],
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
                totalVotes: 1,
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
                totalVotes: 3,
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

    public async getComments(): Promise<Comment[]> {
        return new Array<Comment>(
            new Comment({
                commentId: "37fbb7c9-013f-4057-bc90-f38498b69295",
                parentId: "596632ac-dd54-4700-a783-688618d99fa9",
                commentContent: "I think this post is great!",
                createdAt: 1665770000,
                updatedAt: 1665770000,
                authorUser: new User({
                    userId: "5c0f145b-ffad-4881-8ee6-7647c3c1b695",
                }),
                pinned: true,
                pending: false,
                restrictedProps: null,
                childComments: [],
            }),
            new Comment({
                commentId: "13cc9fd9-4c99-4daa-bf17-750bd1efa5d8",
                parentId: "596632ac-dd54-4700-a783-688618d99fa9",
                commentContent: "First comment! :yay:",
                createdAt: 1665770000,
                updatedAt: 1665770000,
                authorUser: new User({
                    userId: "5c0f145b-ffad-4881-8ee6-7647c3c1b695",
                }),
                pinned: false,
                pending: true,
                restrictedProps: new RestrictedProps({
                    restrictedAt: 1665780000,
                    moderatorId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                    reason: "The moderator thinks there is profanity in this comment",
                }),
                childComments: [
                    new Comment({
                        commentId: "04658465-f9ea-427b-9f5b-ed5e93db27ff",
                        parentId: "13cc9fd9-4c99-4daa-bf17-750bd1efa5d8",
                        commentContent: "Second comment! :yay:",
                        createdAt: 1665770000,
                        updatedAt: 1665770000,
                        authorUser: new User({
                            userId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                        }),
                        pinned: false,
                        pending: true,
                        restrictedProps: new RestrictedProps({
                            restrictedAt: 1665780000,
                            moderatorId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                            reason: "The moderator died of cringe",
                        }),
                        childComments: [],
                    }),
                    new Comment({
                        commentId: "acba2871-2435-4439-82c3-adebc7cdc942",
                        parentId: "13cc9fd9-4c99-4daa-bf17-750bd1efa5d8",
                        commentContent: "First-Second comment! :yay:",
                        createdAt: 1665770000,
                        updatedAt: 1665770000,
                        authorUser: new User({
                            userId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                        }),
                        pinned: false,
                        pending: false,
                        restrictedProps: null,
                        childComments: [],
                    }),
                ],
            })
        );
    }

    public async getPostTypes(): Promise<PostType[]> {
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

    public async getPostTags(): Promise<PostTag[]> {
        return new Array<PostTag>(
            new PostTag({
                tagId: "39b90340-82b7-4149-8f5d-40b00a61d2a2",
                tagName: "serious",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagId: "ee741539-151e-4fcd-91ce-8d4599a15cdf",
                tagName: "advice",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagId: "edf6897b-610d-4c03-8d25-791d47ca663b",
                tagName: "vent",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagId: "740f7690-4a7a-4a91-aec4-05c0c32b6aa4",
                tagName: "Culture",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagId: "59c4221f-f2bb-4a0c-afb4-cc239228ff22",
                tagName: "Gay",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagId: "fc3f85ad-d26b-432e-a0ff-10846d1abf50",
                tagName: "Lesbian",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagId: "04a67854-c56a-4342-9da8-0b6a3a4b2101",
                tagName: "Coming Out",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagId: "32bbe790-dc69-4253-b000-b2fbd1fb87b4",
                tagName: "Gender",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagId: "de8a77db-b819-43d3-9655-894a1cf183ee",
                tagName: "Identity",
                tagColor: "#FF758C",
            })
        );
    }

    public async getAwards(): Promise<Award[]> {
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

    public async getSexualities(): Promise<Sexuality[]> {
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

    public async getGenders(): Promise<Gender[]> {
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

    public async getOpennessRecords(): Promise<Openness[]> {
        return new Array<Openness>(
            new Openness({
                opennessId: "ae90b960-5f00-4298-b509-fac92a59b406",
                opennessLevel: -1,
                opennessDescription: "Not Sure",
            }),
            new Openness({
                opennessId: "842b5bd7-1da1-4a95-9564-1fc3b97b3655",
                opennessLevel: 0,
                opennessDescription: "Not Out",
            }),
            new Openness({
                opennessId: "db27c417-a8a5-4703-9b35-9dc76e98fc95",
                opennessLevel: 1,
                opennessDescription: "Out to Few",
            }),
            new Openness({
                opennessId: "822b2622-70d6-4d7c-860a-f56e309fe950",
                opennessLevel: 2,
                opennessDescription: "Semi-Out",
            }),
            new Openness({
                opennessId: "d5c97584-cd1b-4aa6-82ad-b5ddd3577bee",
                opennessLevel: 3,
                opennessDescription: "Fully Out",
            })
        );
    }
}
