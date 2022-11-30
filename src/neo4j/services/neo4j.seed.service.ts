import { Inject, Injectable } from "@nestjs/common";
import { Comment } from "../../comments/models";
import { CommentToSelfRelTypes } from "../../comments/models/toSelf";
import { Award, Post, PostTag, PostType } from "../../posts/models";
import { HasAwardProps, PostToAwardRelTypes } from "../../posts/models/toAward";
import { PostToCommentRelTypes } from "../../posts/models/toComment";
import { PostToPostTypeRelTypes } from "../../posts/models/toPostType";
import { PostToPostTagRelTypes } from "../../posts/models/toTags";
import { Gender, Openness, Role, Sexuality, User } from "../../users/models";
import { UserToGenderRelTypes } from "../../users/models/toGender";
import { UserToOpennessRelTypes } from "../../users/models/toOpenness";
import { AuthoredProps, UserToPostRelTypes } from "../../users/models/toPost";
import { UserToSexualityRelTypes } from "../../users/models/toSexuality";
import { RestrictedProps, _ToSelfRelTypes } from "../../_domain/models/toSelf";
import { LABELS_DECORATOR_KEY } from "../neo4j.constants";
import { Neo4jService } from "./neo4j.service";
import { _$ } from "../../_domain/injectableTokens";
import { DatabaseContext } from "../../database-access-layer/databaseContext";

@Injectable()
export class Neo4jSeedService {
    constructor(
        @Inject(Neo4jService) private _neo4jService: Neo4jService,
        @Inject(_$.IDatabaseContext) private _dbContext: DatabaseContext
    ) {}

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
        // PostType - PostType.postTypeName IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT postType_postTypeName_UNIQUE FOR (postType:${this.postTypeLabel}) REQUIRE postType.postTypeName IS UNIQUE`,
            {}
        );
        // PostTag - PostTag.tagName IS UNIQUE
        await this._neo4jService.tryWriteAsync(
            `CREATE CONSTRAINT postTag_tagName_UNIQUE FOR (postTag:${this.postTagLabel}) REQUIRE postTag.tagName IS UNIQUE`,
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
        const postTypes = Object.values(await this.getPostTypes());
        for (const postTypeEntity of postTypes) {
            await this._neo4jService.tryWriteAsync(
                `CREATE (n:${this.postTypeLabel} { 
                postTypeName: $postTypeName
             })`,
                {
                    postTypeName: postTypeEntity.postTypeName,
                }
            );
        }

        // Populate post tags
        const postTags = Object.values(await this.getPostTags());
        for (const postTagEntity of postTags) {
            await this._neo4jService.tryWriteAsync(
                `CREATE (n:${this.postTagLabel} { 
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
            const foundGenderEntity = await this._dbContext.Genders.findGenderById(
                genderEntity.genderId
            );
            if (!foundGenderEntity) {
                await this._neo4jService.tryWriteAsync(
                    `CREATE (n:${this.genderLabel} { 
                    genderId: $genderId,
                    genderName: $genderName,
                    genderPronouns: $genderPronouns,
                    genderFlagSvg: $genderFlagSvg
                    })`,
                    genderEntity
                );
            } else {
                await this._dbContext.Genders.updateGender(genderEntity);
            }
        }

        // Populate genders
        const opennessRecords = await this.getOpennessRecords();
        for (const opennessEntity of opennessRecords) {
            const foundOpennessEntity = await this._dbContext.Openness.findOpennessById(
                opennessEntity.opennessId
            );
            if (!foundOpennessEntity) {
                await this._neo4jService.tryWriteAsync(
                    `CREATE (n:${this.opennessLabel} { 
                    opennessId: $opennessId,
                    opennessLevel: $opennessLevel,
                    opennessDescription: $opennessDescription
                })`,
                    opennessEntity
                );
            } else {
                await this._dbContext.Openness.updateOpenness(opennessEntity);
            }
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
                        
                        bio: $bio,
                        avatar: $avatar,
                        
                        level: $level,
                        
                        roles: $roles
                    })-[:${UserToSexualityRelTypes.HAS_SEXUALITY} { isPrivate: $isSexualityPrivate }]->(s), 
                        (u)-[:${UserToGenderRelTypes.HAS_GENDER} { isPrivate: $isGenderPrivate }]->(g),
                        (u)-[:${UserToOpennessRelTypes.HAS_OPENNESS_LEVEL_OF} { isPrivate: $isOpennessPrivate }]->(o)`,
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

                    bio: userEntity.bio,
                    avatar: userEntity.avatar,

                    level: userEntity.level,
                    roles: userEntity.roles,

                    sexualityId: userEntity.sexuality.sexualityId,
                    isSexualityPrivate: userEntity.isSexualityPrivate,

                    genderId: userEntity.gender.genderId,
                    isGenderPrivate: userEntity.isGenderPrivate,

                    opennessId: userEntity.openness.opennessId,
                    isOpennessPrivate: userEntity.isOpennessPrivate,
                }
            );
        }

        // Populate posts
        const posts = await this.getPosts();

        const votesUserIds = [
            "dc83daa3-d26b-4063-87b1-2b719069654e", // verified - alphonse
            "a59437f4-ea62-4a15-a4e6-621b04af74d6", // verified - gabriel
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
                authoredAt: postEntity.updatedAt,
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
                    .map(pt => `"${pt.tagName}"`)
                    .join(",")}] AS postTagNamesToBeConnected
                UNWIND postTagNamesToBeConnected as postTagNameToBeConnected
                    MATCH (p1:${this.postLabel}) WHERE p1.postId = $postId
                    MATCH (postType:${
                        this.postTypeLabel
                    }) WHERE postType.postTypeName = $postTypeName
                    MATCH (postTag:${
                        this.postTagLabel
                    }) WHERE postTag.tagName = postTagNameToBeConnected
                        MERGE (p1)-[:${PostToPostTypeRelTypes.HAS_POST_TYPE}]->(postType)
                        MERGE (p1)-[:${PostToPostTagRelTypes.HAS_POST_TAG}]->(postTag)
                        ${
                            postEntity.awards[PostToAwardRelTypes.HAS_AWARD].records.length > 0
                                ? `WITH [${postEntity.awards[PostToAwardRelTypes.HAS_AWARD].records
                                      .map(record => `"${record.entity.awardId}"`)
                                      .join(",")}] AS awardIDsToBeConnected       
                                    UNWIND awardIDsToBeConnected as awardIdToBeConnected
                                        MATCH (p1:${this.postLabel}) WHERE p1.postId = $postId
                                        MATCH (award:${
                                            this.awardLabel
                                        }) WHERE award.awardId = awardIdToBeConnected
                                            MERGE (p1)-[:${
                                                PostToAwardRelTypes.HAS_AWARD
                                            } { awardedBy: "${
                                      (
                                          postEntity.awards[PostToAwardRelTypes.HAS_AWARD]
                                              .records[0].relProps as HasAwardProps
                                      ).awardedBy
                                  }" } ]->(award)`
                                : ""
                        }
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
                    postTypeName: postEntity.postType.postTypeName,

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
                authoredAt: commentEntity.updatedAt,
                anonymously: false,
            });
            await this._neo4jService.tryWriteAsync(
                `
                MATCH (authorUser:${this.userLabel}) WHERE authorUser.userId = $authorUserId
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

            // Connect Comment to its parent (either a Post or another Comment)
            if (commentEntity.parentId !== null) {
                await this._neo4jService.tryWriteAsync(
                    `
                    MATCH (comment:${this.commentLabel} { commentId: $commentId })
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
                        `
                        MATCH (comment:${this.commentLabel} { commentId: $commentId })
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
        const authoredPosts = {
            [UserToPostRelTypes.AUTHORED]: {
                records: [],
                relType: UserToPostRelTypes.AUTHORED,
            },
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
            [UserToPostRelTypes.REPORTED]: {
                records: [],
                relType: UserToPostRelTypes.REPORTED,
            },
        };

        return new Array<User>(
            new User({
                userId: "71120d45-7a75-43fd-b79c-54b06e7868af", // verified
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                avatar: "(づ￣ 3￣)づ",
                bio: "My name is Wesley.",
                username: "wesley",
                normalizedUsername: "WESLEY",
                passwordHash: "",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "wesley@domain.com",
                emailVerified: false,
                level: 0,
                roles: [Role.USER, Role.MODERATOR],
                gender: new Gender({
                    genderId: "585d31aa-d5b3-4b8d-9690-ffcd57ce2862", // verified - Male - He/Him
                }),
                isGenderPrivate: false,
                sexuality: new Sexuality({
                    sexualityId: "9164d89b-8d71-4fd1-af61-155d1d7ffe53", // verified - Gay
                }),
                isSexualityPrivate: false,
                openness: new Openness({
                    opennessId: "db27c417-a8a5-4703-9b35-9dc76e98fc95", // verified - Out to Few
                }),
                isOpennessPrivate: false,
                posts: { ...authoredPosts },
            }),
            new User({
                userId: "5e520efd-f78e-4cb0-8903-5c99197d4b8e", // verified
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                avatar: "...(*￣０￣)ノ",
                bio: "My name is Gaius.",
                username: "gaius",
                normalizedUsername: "GAIUS",
                passwordHash: "",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "gaius@rome.it",
                emailVerified: false,
                level: 0,
                roles: [Role.USER],
                gender: new Gender({
                    genderId: "3af72545-99d4-4715-812b-c935fbf57f22", // verified - ve/ver
                }),
                isGenderPrivate: false,
                sexuality: new Sexuality({
                    sexualityId: "5bc9535e-cc50-4112-91ad-717dc2de9492", // verified - Bisexual
                }),
                isSexualityPrivate: false,
                openness: new Openness({
                    opennessId: "842b5bd7-1da1-4a95-9564-1fc3b97b3655", // verified - Not Out
                }),
                isOpennessPrivate: false,
                posts: { ...authoredPosts },
            }),
            new User({
                userId: "a59437f4-ea62-4a15-a4e6-621b04af74d6", // verified
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                avatar: ":^)",
                bio: "My name is gabriel.",
                username: "gabriel",
                normalizedUsername: "GABRIEL",
                passwordHash: "",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "gabriel@domain.com",
                emailVerified: false,
                level: 0,
                roles: [Role.USER],
                gender: new Gender({
                    genderId: "f97edcdf-9df4-4f4a-9114-fbcd702502af", // verified - NA
                }),
                isGenderPrivate: false,
                sexuality: new Sexuality({
                    sexualityId: "2d32c4d3-4aca-4b03-bf68-ba104656183f", // verified - Asexual
                }),
                isSexualityPrivate: false,
                openness: new Openness({
                    opennessId: "ae90b960-5f00-4298-b509-fac92a59b406", // verified - Not Sure
                }),
                isOpennessPrivate: false,
                posts: { ...authoredPosts },
            }),
            new User({
                userId: "dc83daa3-d26b-4063-87b1-2b719069654e", // verified
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                avatar: "^_^",
                bio: "My name is alphonse.",
                username: "alphonse",
                normalizedUsername: "ALPHONSE",
                passwordHash: "",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "admin@domain.com",
                emailVerified: false,
                level: 0,
                roles: [Role.USER],
                gender: new Gender({
                    genderId: "585d31aa-d5b3-4b8d-9690-ffcd57ce2862", // verified - Male - He/Him
                }),
                isGenderPrivate: false,
                sexuality: new Sexuality({
                    sexualityId: "9164d89b-8d71-4fd1-af61-155d1d7ffe53", // verified - Gay
                }),
                isSexualityPrivate: false,
                openness: new Openness({
                    opennessId: "d5c97584-cd1b-4aa6-82ad-b5ddd3577bee", // verified - Fully Out
                }),
                isOpennessPrivate: false,
                posts: { ...authoredPosts },
            }),
            new User({
                userId: "0daef999-7291-4f0c-a41a-078a6f28aa5e", // verified
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                avatar: "^_^",
                bio: "My name is christopher.",
                username: "christopher",
                normalizedUsername: "CHRISTOPHER",
                passwordHash: "",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "christopher@domain.com",
                emailVerified: false,
                level: 0,
                roles: [Role.USER, Role.MODERATOR],
                gender: new Gender({
                    genderId: "585d31aa-d5b3-4b8d-9690-ffcd57ce2862", // verified - Male - He/Him
                }),
                isGenderPrivate: true,
                sexuality: new Sexuality({
                    sexualityId: "9164d89b-8d71-4fd1-af61-155d1d7ffe53", // verified - Gay
                }),
                isSexualityPrivate: true,
                openness: new Openness({
                    opennessId: "d5c97584-cd1b-4aa6-82ad-b5ddd3577bee", // verified - Fully Out
                }),
                isOpennessPrivate: false,
                posts: { ...authoredPosts },
            })
        );
    }

    public async getPosts(): Promise<Post[]> {
        const postTags = await this.getPostTags();
        const postTypes = await this.getPostTypes();
        return new Array<Post>(
            new Post({
                postId: "bcddeb57-939d-441b-b4ea-71e1d2055f32", // verified
                postTitle: "Sister caught me checking out a guy on a camping trip",
                postContent:
                    "I was on a camping trip and my sister caught me staring at someone across the site with his \n" +
                    " shirt off, for the the rest of the day she wouldn't stop asking me, even getting the other members \n" +
                    " who came with us to join in, I eventually gave in, she was super kind about it and came out as Bisexual the following months",
                updatedAt: new Date("2022-11-17").getTime(), // verified - NOTE: will be counted as `authoredAt` value.
                postType: postTypes.story, // verified - story
                postTags: [postTags.Casual, postTags.General, postTags.Trigger], // verified
                restrictedProps: null,
                authorUser: new User({
                    userId: "a59437f4-ea62-4a15-a4e6-621b04af74d6", // verified - gabriel
                }),
                pending: false,
                totalVotes: 0,
                awards: {
                    [PostToAwardRelTypes.HAS_AWARD]: {
                        records: [],
                        relType: PostToAwardRelTypes.HAS_AWARD,
                    },
                },
            }),
            new Post({
                postId: "be9ab5e4-eb7c-469b-a1e3-592dca2a00d0", // verified
                postTitle: "Coming out to my accepting family",
                postContent:
                    "Growing up my family was really gay friendly. I had two gay uncles and everyone was accepting of them. \n " +
                    "When I was in fifth grade my mom told me that she would love me no matter who I loved. At the time I had  \n " +
                    "no idea what she meant because all I cared about was playing soccer. However, as I got older I started \n " +
                    "to comprehend what my mother's words really meant. In middle school all my friends talked about boys and \n " +
                    "tried getting boyfriends, but I wasn't interested. That's when I started to realize that I was different from all my friends. \n\n " +
                    "During my first year of high school I realized I was a lesbian and it felt good to know that my mother was there to support me. \n " +
                    "At the end of my first year of high school I began dating my best friend, but that relationship only lasted three months before my \n " +
                    "girlfriend started cheating on me with my cousin. I hadn't openly come out to my family yet so I tried to keep the relationship and \n " +
                    "breakup a secret. One day one of my sisters saw me crying and she asked me what was wrong. I told her everything that had been going \n " +
                    "on between my cousin, my ex-girlfriend, and me. Instead of addressing the fact that I had dated a girl, my sister was mad about what \n " +
                    "my cousin had done. My sister told everyone in my family what had happened and everyone was upset about what my cousin had done. \n " +
                    "No one in my family was upset about the fact that my cousin and I were gay. \n\n " +
                    "Today my entire family knows that I am gay and they accept me. It is nice to have such an accepting family and I know that I am \n " +
                    "very fortunate to have a family that loves me unconditionally. I am grateful that my family has never judged me or made me feel \n " +
                    "uncomfortable expressing who I am.",
                updatedAt: new Date("2022-11-20").getTime(), // verified - NOTE: will be counted as `authoredAt` value.
                postType: postTypes.story, // verified - story
                postTags: [postTags.Serious], // verified - Serious
                restrictedProps: new RestrictedProps({
                    restrictedAt: new Date("2022-11-22").getTime(),
                    moderatorId: "71120d45-7a75-43fd-b79c-54b06e7868af", // verified - moderator - wesley
                    reason: "The moderator thinks there is profanity in this post",
                }),
                authorUser: new User({
                    userId: "dc83daa3-d26b-4063-87b1-2b719069654e", // verified - alphonse
                }),
                pending: true,
                totalVotes: 3,
                awards: {
                    [PostToAwardRelTypes.HAS_AWARD]: {
                        records: (await this.getAwards()).slice(-1, 1).map(award => ({
                            entity: award,
                            relProps: new HasAwardProps({
                                awardedBy: "0daef999-7291-4f0c-a41a-078a6f28aa5e", // verified - moderator - christopher
                            }),
                        })),
                        relType: PostToAwardRelTypes.HAS_AWARD,
                    },
                },
            }),
            new Post({
                postId: "806ca5f3-f80c-47fc-9e4d-00434dd18358", // verified
                postTitle: "Coming out to my brother",
                postContent: `When I was 17 my girlfriend was over my house and my brother was home from college. 
                                She asks me "does your brother know we're dating?"I say "good question." Then I yell to the other 
                                side of the house "[Brother]! Did you know that I'm dating [girlfriend]?" I think he said 
                                something like "I do now!"`,
                updatedAt: new Date("2022-09-01").getTime(), // verified - NOTE: will be counted as `authoredAt` value.
                postType: postTypes.story, // verified - story
                postTags: [postTags.Casual], // verified - Casual
                restrictedProps: null,
                authorUser: new User({
                    userId: "71120d45-7a75-43fd-b79c-54b06e7868af", // verified - wesley - moderator
                }),
                pending: false,
                totalVotes: 0,
                awards: {
                    [PostToAwardRelTypes.HAS_AWARD]: {
                        records: [],
                        relType: PostToAwardRelTypes.HAS_AWARD,
                    },
                },
            }),
            new Post({
                postId: "6326079f-fd2f-4b81-83fe-487daee459bc", // verified
                postTitle: "Coming out as GNC on my birthday",
                postContent: `This is the uncomfortable story of how I came out to my mom and younger brother (with whom I live). 
                                \n\nLeading up to my birthday last year I had realized I'm gnc (gender nonconforming) and had been starting to feel 
                                very uncomfortable with masculine pronouns. I was already looking for a replacement name at the time and knew I 
                                needed to do something about the way I was being referred to for my sanity. I've never been particularly fond of 
                                holidays (my birthday especially) because something always seems to go awry when family is involved. None the less 
                                I decided to take control of the situation and hope for the best. \n\nI custom ordered my cake and bought all the 
                                ingredients for the meal and cooked it myself. I even did my makeup. Not something I do often, but it was my birthday 
                                and I wanted to feel pretty. Before unveiling the cake (decorated with a nonbinary flag) I went through the whole 
                                spiel about being nb and what that meant for me, as well as explaining pronouns and what not. \n\nWhen I finished they 
                                were silent for a minute or two. My brother spoke first, saying something to the tune of: My dad says gnc people go 
                                to hell. Obviously not the first thing you want to hear after such a tense interaction. Long story short dinner resolved 
                                peacefully but it didn't seem I got through to them as the next couple weeks were filled with pronoun related arguments. 
                                \n\nMuch headbutting later they've come around on my pronouns and the name I've chosen. As you can imagine though, for a 
                                time I felt extremely unwelcome in the home, and after all the effort I put in I was pretty devastated my coming out 
                                transpired so poorly.`,
                updatedAt: new Date("2022-05-26").getTime(), // verified - NOTE: will be counted as `authoredAt` value.
                postType: postTypes.story, // verified - story
                postTags: [postTags.Serious], // verified - Serious
                restrictedProps: null,
                authorUser: new User({
                    userId: "5e520efd-f78e-4cb0-8903-5c99197d4b8e", // verified - gaius
                }),
                pending: false,
                totalVotes: 0,
                awards: {
                    [PostToAwardRelTypes.HAS_AWARD]: {
                        records: [],
                        relType: PostToAwardRelTypes.HAS_AWARD,
                    },
                },
            })
        );
    }

    public async getComments(): Promise<Comment[]> {
        return new Array<Comment>(
            new Comment({
                commentId: "f8959b32-5b68-4f68-97bc-59afdc0d09cb", // verified - no children
                parentId: "bcddeb57-939d-441b-b4ea-71e1d2055f32", // verified - Title: Sister caught me checking out a guy on a camping trip.
                commentContent: "Wow that's so nice to hear!",
                updatedAt: new Date("2022-11-18").getTime(), // verified - a day after Post authored
                authorUser: new User({
                    userId: "0daef999-7291-4f0c-a41a-078a6f28aa5e", // verified - moderator - christopher
                }),
                pinned: true, // verified
                pending: false,
                restrictedProps: null,
                childComments: [],
            }),
            new Comment({
                commentId: "c13c4349-bbf9-45a7-a573-7a04efa66e3c", // verified
                parentId: "be9ab5e4-eb7c-469b-a1e3-592dca2a00d0", // verified - Title: Coming out to my accepting family
                commentContent: `Congratulations! That's so nice you have such a supportive family. 
                                Sorry to hear about your ex-girlfriend and your cousin though. I hope you're doing better now.`,
                updatedAt: new Date("2022-11-21").getTime(), // verified - a day after post authored
                authorUser: new User({
                    userId: "a59437f4-ea62-4a15-a4e6-621b04af74d6", // verified - gabriel
                }),
                pinned: false,
                pending: true,
                restrictedProps: null,
                childComments: [
                    new Comment({
                        commentId: "3ee2801a-998d-437a-a49e-3974919f35c1", // verified
                        parentId: "c13c4349-bbf9-45a7-a573-7a04efa66e3c", // verified
                        commentContent: `Wow that's so scummy of your cousin to do that to you! I would have never forgiven her.`,
                        updatedAt: new Date("2022-11-22").getTime(), // verified - a day after parent authored
                        authorUser: new User({
                            userId: "dc83daa3-d26b-4063-87b1-2b719069654e", // verified - alphonse
                        }),
                        pinned: false,
                        pending: true,
                        restrictedProps: null,
                        childComments: [
                            new Comment({
                                commentId: "287ca219-005e-41fa-af40-abf59c2c2caf", // verified
                                parentId: "3ee2801a-998d-437a-a49e-3974919f35c1", // verified
                                commentContent: `I agree! I would have never forgiven her either.`,
                                updatedAt: new Date("2022-11-23").getTime(), // verified - a day after parent comment authored
                                authorUser: new User({
                                    userId: "0daef999-7291-4f0c-a41a-078a6f28aa5e", // verified - christopher
                                }),
                                pinned: false,
                                pending: true,
                                restrictedProps: new RestrictedProps({
                                    restrictedAt: new Date("2022-11-23").getTime(),
                                    moderatorId: "71120d45-7a75-43fd-b79c-54b06e7868af", // verified - moderator - wesley
                                    reason: "The moderator died of cringe",
                                }),
                                childComments: [],
                            }),
                        ],
                    }),
                ],
            }),
            new Comment({
                commentId: "5a11c2af-7716-4b67-b00f-e23df9f0c740", // verified
                parentId: "806ca5f3-f80c-47fc-9e4d-00434dd18358", // verified - top-level comment - Post Title: Coming out to my brother
                commentContent: `That story is so funny! What a supportive brother.`,
                updatedAt: new Date("2022-09-03").getTime(), // verified - 2 days after post authored
                authorUser: new User({
                    userId: "dc83daa3-d26b-4063-87b1-2b719069654e", // verified - alphonse
                }),
                pinned: false,
                pending: false,
                restrictedProps: null,
                childComments: [
                    new Comment({
                        commentId: "9e55090e-2ebf-4679-a912-6542e78f4905", // verified
                        parentId: "5a11c2af-7716-4b67-b00f-e23df9f0c740", // verified
                        commentContent: `Same! I wish my brother was like that.`,
                        updatedAt: new Date("2022-09-04").getTime(),
                        authorUser: new User({
                            userId: "dc83daa3-d26b-4063-87b1-2b719069654e", // verified - alphonse
                        }),
                        pinned: false,
                        pending: false,
                        restrictedProps: null,
                        childComments: [],
                    }),
                ],
            }),
            new Comment({
                commentId: "773c1b6d-9d0a-43cb-94e5-2da1bac633c0", // verified
                parentId: "6326079f-fd2f-4b81-83fe-487daee459bc", // verified - top-level comment - Post Title: Coming out as GNC on my birthday
                commentContent:
                    "Wow I can't even imagine how hard that must have been. Thankfully your family now understands what you're going through.",
                updatedAt: new Date("2022-05-27").getTime(), // verified - a day after the post was authored
                authorUser: new User({
                    userId: "71120d45-7a75-43fd-b79c-54b06e7868af", // verified - wesley
                }),
                pinned: false,
                pending: false,
                restrictedProps: null,
                childComments: [],
            }),
            new Comment({
                commentId: "84213582-a148-46b7-878d-c30a9cd02231", // verified
                parentId: "6326079f-fd2f-4b81-83fe-487daee459bc", // verified - top-level comment - Post Title: Coming out as GNC on my birthday
                commentContent: "You dad sounds exhausting. I'm glad you're doing better now.",
                updatedAt: new Date("2022-05-27").getTime(), // verified - a day after the post was authored
                authorUser: new User({
                    userId: "dc83daa3-d26b-4063-87b1-2b719069654e", // verified - alphonse
                }),
                pinned: false,
                pending: false,
                restrictedProps: null,
                childComments: [],
            })
        );
    }

    public async getPostTypes(): Promise<Record<"queery" | "story", PostType>> {
        return {
            queery: new PostType({
                postTypeName: "queery",
            }),
            story: new PostType({
                postTypeName: "story",
            }),
        };
    }

    public async getPostTags(): Promise<
        Record<
            | "Serious"
            | "Advice"
            | "Discussion"
            | "Trigger"
            | "General"
            | "Casual"
            | "Inspiring"
            | "Vent"
            | "Drama",
            PostTag
        >
    > {
        return {
            Serious: new PostTag({
                tagName: "serious",
                tagColor: "#E02947",
            }),
            Advice: new PostTag({
                tagName: "advice",
                tagColor: "#FFB6C3",
            }),
            Discussion: new PostTag({
                tagName: "discussion",
                tagColor: "#FFB6C3",
            }),
            Trigger: new PostTag({
                tagName: "trigger",
                tagColor: "#C2ADFF",
            }),
            General: new PostTag({
                tagName: "general",
                tagColor: "#FFB6C3",
            }),
            Casual: new PostTag({
                tagName: "casual",
                tagColor: "#FFEAD4",
            }),
            Inspiring: new PostTag({
                tagName: "inspiring",
                tagColor: "#C2ADFF",
            }),
            Vent: new PostTag({
                tagName: "vent",
                tagColor: "#C2ADFF",
            }),
            Drama: new PostTag({
                tagName: "drama",
                tagColor: "#C2ADFF",
            }),
        };
    }

    public async getAwards(): Promise<Award[]> {
        return new Array<Award>(
            new Award({
                awardId: "032930d2-9994-46cc-ad35-559bb41a9d05",
                awardName: "Saddest Story Award",
                awardSvg: "<svg></svg>",
            }),
            new Award({
                awardId: "375608ce-ca65-4293-8402-da34cd2c42c7",
                awardName: "Quality Queery Award",
                awardSvg: "<svg></svg>",
            }),
            new Award({
                awardId: "bf99f8f5-66f7-41ce-8014-5f70e5145174",
                awardName: "Best Ally Award",
                awardSvg: "<svg></svg>",
            })
        );
    }

    public async getSexualities(): Promise<Sexuality[]> {
        return new Array<Sexuality>(
            new Sexuality({
                sexualityId: "9164d89b-8d71-4fd1-af61-155d1d7ffe53", // verified
                sexualityName: "Gay",
                sexualityFlagSvg: "<svg></svg>",
            }),
            new Sexuality({
                sexualityId: "1b67cf76-752d-4ea5-9584-a4232998b838", // verified
                sexualityName: "Lesbian",
                sexualityFlagSvg: "<svg></svg>",
            }),
            new Sexuality({
                sexualityId: "df388311-c184-4f09-93f4-645c6175322c", // verified
                sexualityName: "Homosexual",
                sexualityFlagSvg: "<svg></svg>",
            }),
            new Sexuality({
                sexualityId: "2d32c4d3-4aca-4b03-bf68-ba104656183f", // verified
                sexualityName: "Asexual",
                sexualityFlagSvg: "<svg></svg>",
            }),
            new Sexuality({
                sexualityId: "5bc9535e-cc50-4112-91ad-717dc2de9492", // verified
                sexualityName: "Bisexual",
                sexualityFlagSvg: "<svg></svg>",
            })
        );
    }

    public async getGenders(): Promise<Gender[]> {
        return new Array<Gender>(
            new Gender({
                genderId: "f97edcdf-9df4-4f4a-9114-fbcd702502af", // verified
                genderName: "NA",
                genderPronouns: "NA",
                genderFlagSvg: `<?xml version="1.0" encoding="UTF-8"?><svg id="Layer_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><style>.cls-1{fill:#ff758c;}.cls-2{fill:#dfeeff;}</style></defs><g id="Layer_11"><g><circle class="cls-1" cx="250" cy="250" r="250"/><path class="cls-2" d="M204.51,18.6c-35.72,6.82-69.95,34.55-72.6,70.82-.86,11.76,1.37,24.47-4.53,34.67-7.39,12.78-23.91,15.97-37.81,20.94-30.2,10.8-54.77,36.23-64.54,66.77-5.25,16.41-6.12,35.19,2.42,50.15,8.21,14.39,24.04,23.58,30.83,38.69,11.83,26.33-8.57,56.61-4.71,85.21,2.37,17.55,14.64,33.42,31.03,40.14,18.55,7.6,39.93,3.7,59.19,9.22,22.17,6.36,38.86,24.23,58.64,36.09,41.17,24.69,97.69,20.48,134.76-10.02,26.86-22.11,42.76-55.11,68.76-78.22,28.38-25.22,70.86-42.34,77.16-79.78,8.32-49.5-55.34-86.77-53.81-136.94,.66-21.67,13.8-42.94,8.26-63.89-3.95-14.95-16.64-25.92-29.77-34.1-30.06-18.73-64.42-22.28-97.08-33.96-34.57-12.36-68.86-22.92-106.2-15.79Z"/><g><path d="M186.67,282.29c-8.4-28.92-15.66-55.5-21.78-79.74v59.04c0,5.04,.48,13.62,1.44,25.74,.84,13.2,1.26,21.72,1.26,25.56,0,1.08-.66,2.01-1.98,2.79-1.32,.78-2.82,1.17-4.5,1.17-2.52,0-3.78-.96-3.78-2.88l.36-5.22c.24-3.84,.36-6.36,.36-7.56,0-6.36-.36-16.44-1.08-30.24-.72-14.04-1.08-22.56-1.08-25.56v-23.04c0-3.72,.18-9.24,.54-16.56,.48-6.36,.72-11.88,.72-16.56v-1.08c0-6,1.32-9,3.96-9,1.56,0,3.54,2.64,5.94,7.92,3.96,8.64,9,24.12,15.12,46.44,3.48,12.96,7.56,29.64,12.24,50.04-.12-.48,.84,3.66,2.88,12.42l.18,.9c0-11.64,.12-22.08,.36-31.32l.36-31.32v-53.28c.48-3,2.4-4.5,5.76-4.5s4.86,2.34,4.86,7.02v1.08c-.72,1.44-1.08,3.18-1.08,5.22,0,7.32-.18,18.36-.54,33.12-.36,14.88-.54,26.04-.54,33.48v54.9c0,1.92-.51,3.75-1.53,5.49-1.02,1.74-2.25,2.61-3.69,2.61-2.4,0-7.32-12.36-14.76-37.08Z"/><path d="M234.63,320.27c-.42-.72-.63-1.68-.63-2.88,0-.84,.18-1.98,.54-3.42l15.66-62.64c10.32-41.64,16.44-65.34,18.36-71.1,.12-.84,.66-1.26,1.62-1.26s1.74,.39,2.34,1.17c.6,.78,.9,1.77,.9,2.97l-.18,1.44c-1.56,8.52-4.8,22.83-9.72,42.93-4.92,20.1-9.84,39.18-14.76,57.24-4.92,18.06-8.52,29.61-10.8,34.65-.36,1.32-.96,1.98-1.8,1.98-.6,0-1.11-.36-1.53-1.08Z"/><path d="M328.77,315.59c-.9-.72-1.35-1.92-1.35-3.6v-23.58c-1.56-1.08-4.5-2.04-8.82-2.88-4.32-.84-8.4-1.38-12.24-1.62-1.32,2.52-2.28,5.58-2.88,9.18l-.72,3.6c-.12,.84-.48,2.7-1.08,5.58-.6,2.88-1.26,5.37-1.98,7.47-.72,2.1-1.44,3.75-2.16,4.95-4.56,0-7.2-1.2-7.92-3.6,1.32-1.92,2.82-7.56,4.5-16.92l5.94-32.94c2.64-15.6,5.07-28.92,7.29-39.96,2.22-11.04,4.59-20.28,7.11-27.72,2.76-8.28,5.4-12.42,7.92-12.42s4.44,.48,5.76,1.44c0,4.8,1.14,16.38,3.42,34.74,2.4,18,3.6,30.3,3.6,36.9s.66,15.48,1.98,27.36c1.2,12.12,1.8,21.78,1.8,28.98,0,4.08-1.98,6.12-5.94,6.12-1.92,0-3.33-.36-4.23-1.08Zm-1.53-38.16c-.36-5.28-.96-11.82-1.8-19.62-2.76-27.12-4.14-43.74-4.14-49.86v-1.44c-1.2,1.2-2.85,6.63-4.95,16.29-2.1,9.66-4.05,20.01-5.85,31.05-1.8,11.04-2.76,18.36-2.88,21.96,5.04,1.44,10.38,2.16,16.02,2.16,.96,0,2.16-.18,3.6-.54Z"/></g></g></g></svg>`,
            }),
            new Gender({
                genderId: "7351c1c9-50cd-4871-9af0-60c8f99a4627", // verified
                genderName: "Female",
                genderPronouns: "She/Her",
                genderFlagSvg: "<svg></svg>",
            }),
            new Gender({
                genderId: "585d31aa-d5b3-4b8d-9690-ffcd57ce2862", // verified
                genderName: "Male",
                genderPronouns: "He/Him",
                genderFlagSvg: `<?xml version="1.0" encoding="UTF-8"?><svg id="Layer_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><style>.cls-1{fill:#ff758c;}.cls-2{fill:#dfeeff;}</style></defs><g id="Layer_11"><g><circle class="cls-1" cx="250" cy="250" r="250"/><path class="cls-2" d="M204.51,18.6c-35.72,6.82-69.95,34.55-72.6,70.82-.86,11.76,1.37,24.47-4.53,34.67-7.39,12.78-23.91,15.97-37.81,20.94-30.2,10.8-54.77,36.23-64.54,66.77-5.25,16.41-6.12,35.19,2.42,50.15,8.21,14.39,24.04,23.58,30.83,38.69,11.83,26.33-8.57,56.61-4.71,85.21,2.37,17.55,14.64,33.42,31.03,40.14,18.55,7.6,39.93,3.7,59.19,9.22,22.17,6.36,38.86,24.23,58.64,36.09,41.17,24.69,97.69,20.48,134.76-10.02,26.86-22.11,42.76-55.11,68.76-78.22,28.38-25.22,70.86-42.34,77.16-79.78,8.32-49.5-55.34-86.77-53.81-136.94,.66-21.67,13.8-42.94,8.26-63.89-3.95-14.95-16.64-25.92-29.77-34.1-30.06-18.73-64.42-22.28-97.08-33.96-34.57-12.36-68.86-22.92-106.2-15.79Z"/><g><path d="M99.71,281.97l.18-10.26,.18-8.28v-2.34c.12-.96,.18-2.1,.18-3.42,0-.24-.18-.54-.54-.9-.36-.36-.54-.66-.54-.9v-.18c-.6,.24-1.68,.36-3.24,.36s-3.48-.24-5.76-.72c-.72-.12-2.64-.42-5.76-.9v20.7c0,3.12,.18,8.04,.54,14.76,.36,6.6,.54,11.52,.54,14.76,0,1.8-.48,3.36-1.44,4.68-.96,1.32-2.22,1.98-3.78,1.98-2.28,0-3.9-2.22-4.86-6.66-.96-4.56-1.44-10.5-1.44-17.82l.36-14.58c.12-4.08,.18-8.4,.18-12.96v-5.58c0-1.92-.06-3.18-.18-3.78v-.9l.54-10.44c0-4.56-.18-11.34-.54-20.34-.36-9-.54-15.78-.54-20.34,0-1.44,.48-2.7,1.44-3.78,.96-1.08,2.16-1.62,3.6-1.62,3.84,0,5.76,3.6,5.76,10.8l-.36,22.32c-.24,6.72-.36,14.22-.36,22.5,1.8,.6,5.04,.9,9.72,.9h6.66c.24-.72,.36-1.44,.36-2.16,0-5.76-.36-14.28-1.08-25.56-.84-10.56-1.26-19.14-1.26-25.74,0-1.32,.51-2.43,1.53-3.33,1.02-.9,2.25-1.35,3.69-1.35,.84,0,2.04,.3,3.6,.9l1.62,.72c0,17.04,.6,39.78,1.8,68.22l1.62,45.54c0,1.68-.63,3-1.89,3.96-1.26,.96-2.73,1.44-4.41,1.44-4.08,0-6.12-9.9-6.12-29.7Z"/><path d="M137.77,312.39c-1.26-1.08-1.95-2.4-2.07-3.96v-8.28c-.12-1.08-.18-2.34-.18-3.78,0-2.52-.18-6.36-.54-11.52l-.36-11.52c0-5.88,.18-14.64,.54-26.28,.48-10.44,.72-19.2,.72-26.28,0-1.68-.18-4.2-.54-7.56-.36-3.48-.54-6-.54-7.56,0-8.52,2.52-12.78,7.56-12.78,3.96,0,8.55,.78,13.77,2.34,5.22,1.56,7.83,3.42,7.83,5.58,0,1.2-.51,2.31-1.53,3.33-1.02,1.02-2.25,1.83-3.69,2.43-5.04-1.8-9.6-3-13.68-3.6,.12,1.8,.18,4.38,.18,7.74,0,4.8-.06,9.12-.18,12.96-.36,5.76-.54,10.08-.54,12.96l.54,2.88,2.88-.18c.96-.12,2.16-.18,3.6-.18,5.76,0,8.64,1.68,8.64,5.04,0,1.32-.54,2.43-1.62,3.33s-2.46,1.35-4.14,1.35c-2.16,0-3.84-.12-5.04-.36h-4.5c.24,3.12,.36,7.68,.36,13.68s-.06,11.4-.18,16.2c-.36,7.32-.54,12.78-.54,16.38,0,6.72,.12,10.08,.36,10.08l5.94-.18c2.04-.12,4.5-.18,7.38-.18,4.56,0,6.84,1.44,6.84,4.32,0,1.68-.75,2.97-2.25,3.87-1.5,.9-3.33,1.35-5.49,1.35h-15.3c-1.56,0-2.97-.54-4.23-1.62Z"/><path d="M188.17,315.27c-.42-.72-.63-1.68-.63-2.88,0-.84,.18-1.98,.54-3.42l15.66-62.64c10.32-41.64,16.44-65.34,18.36-71.1,.12-.84,.66-1.26,1.62-1.26s1.74,.39,2.34,1.17c.6,.78,.9,1.77,.9,2.97l-.18,1.44c-1.56,8.52-4.8,22.83-9.72,42.93-4.92,20.1-9.84,39.18-14.76,57.24-4.92,18.06-8.52,29.61-10.8,34.65-.36,1.32-.96,1.98-1.8,1.98-.6,0-1.11-.36-1.53-1.08Z"/><path d="M276.64,281.97l.18-10.26,.18-8.28v-2.34c.12-.96,.18-2.1,.18-3.42,0-.24-.18-.54-.54-.9-.36-.36-.54-.66-.54-.9v-.18c-.6,.24-1.68,.36-3.24,.36s-3.48-.24-5.76-.72c-.72-.12-2.64-.42-5.76-.9v20.7c0,3.12,.18,8.04,.54,14.76,.36,6.6,.54,11.52,.54,14.76,0,1.8-.48,3.36-1.44,4.68-.96,1.32-2.22,1.98-3.78,1.98-2.28,0-3.9-2.22-4.86-6.66-.96-4.56-1.44-10.5-1.44-17.82l.36-14.58c.12-4.08,.18-8.4,.18-12.96v-5.58c0-1.92-.06-3.18-.18-3.78v-.9l.54-10.44c0-4.56-.18-11.34-.54-20.34-.36-9-.54-15.78-.54-20.34,0-1.44,.48-2.7,1.44-3.78,.96-1.08,2.16-1.62,3.6-1.62,3.84,0,5.76,3.6,5.76,10.8l-.36,22.32c-.24,6.72-.36,14.22-.36,22.5,1.8,.6,5.04,.9,9.72,.9h6.66c.24-.72,.36-1.44,.36-2.16,0-5.76-.36-14.28-1.08-25.56-.84-10.56-1.26-19.14-1.26-25.74,0-1.32,.51-2.43,1.53-3.33,1.02-.9,2.25-1.35,3.69-1.35,.84,0,2.04,.3,3.6,.9l1.62,.72c0,17.04,.6,39.78,1.8,68.22l1.62,45.54c0,1.68-.63,3-1.89,3.96-1.26,.96-2.73,1.44-4.41,1.44-4.08,0-6.12-9.9-6.12-29.7Z"/><path d="M304,306.09c0-2.88,1.86-4.32,5.58-4.32h1.98l1.8,.18c.96,0,1.62-.3,1.98-.9,.36-.6,.54-1.68,.54-3.24,0-2.04-.12-5.22-.36-9.54-.36-2.88-.78-8.04-1.26-15.48-1.08-18.36-1.62-32.22-1.62-41.58,0-3.36,.06-6.42,.18-9.18l.18-9.18c0-3.96-.18-7.26-.54-9.9-1.92,.48-3.3,.72-4.14,.72-2.88,0-4.32-1.44-4.32-4.32,0-1.44,.9-2.7,2.7-3.78,1.8-1.08,4.08-1.86,6.84-2.34,4.8-.96,9.06-1.44,12.78-1.44,1.44,0,2.67,.51,3.69,1.53,1.02,1.02,1.53,2.19,1.53,3.51s-.39,2.46-1.17,3.42c-.78,.96-1.77,1.44-2.97,1.44-.72,0-1.32-.06-1.8-.18h-1.44c-1.2,0-2.07,.27-2.61,.81s-.81,1.53-.81,2.97c0,11.64,.72,29.16,2.16,52.56,.24,4.32,.72,10.68,1.44,19.08,.6,5.52,.9,11.16,.9,16.92v6.84c.72-.12,1.92-.18,3.6-.18,5.04,0,7.56,2.1,7.56,6.3v1.08l-4.5,3.06c-.12,0-.51,.03-1.17,.09-.66,.06-1.89,.09-3.69,.09-3.84,.24-6.3,.36-7.38,.36-10.44,0-15.66-1.8-15.66-5.4Z"/><path d="M418.3,309.87v-23.04c0-6-.42-13.86-1.26-23.58-.96-10.92-1.44-18.42-1.44-22.5l.36-11.16c.24-3.24,.36-6.9,.36-10.98-.48,1.56-2.46,9.84-5.94,24.84-3.48,14.52-7.08,27.96-10.8,40.32-3.6,11.88-6.54,17.82-8.82,17.82s-4.11-.69-5.49-2.07c-1.38-1.38-2.07-3.27-2.07-5.67,0-5.28-2.13-16.5-6.39-33.66-4.26-17.16-8.13-31.2-11.61-42.12l-1.08,20.34c-.96,17.16-1.62,31.44-1.98,42.84-.24,11.04-.36,18.6-.36,22.68,0,.96,.06,1.86,.18,2.7v2.52c0,2.04-.42,3.57-1.26,4.59-.84,1.02-2.4,1.53-4.68,1.53-1.2,0-2.34-.45-3.42-1.35s-1.62-1.89-1.62-2.97c0-12.24,.9-30.6,2.7-55.08,1.8-24.48,2.7-42.84,2.7-55.08-.72-1.08-1.08-2.22-1.08-3.42,0-1.44,.69-2.55,2.07-3.33,1.38-.78,3.03-1.17,4.95-1.17,1.56,0,4.44,5.64,8.64,16.92,4.2,11.28,8.4,24.06,12.6,38.34,4.2,14.28,6.9,24.6,8.1,30.96,.96-3.24,1.74-6.24,2.34-9l1.08-4.32c3.84-16.8,7.68-31.98,11.52-45.54,2.28-8.28,4.5-14.76,6.66-19.44,2.16-5.04,4.14-7.56,5.94-7.56,1.68,0,3.21,.45,4.59,1.35,1.38,.9,2.07,2.07,2.07,3.51,0,8.64,.36,21.6,1.08,38.88,.84,16.08,1.26,28.56,1.26,37.44l-.18,9.54-.36,9.54c0,1.44,.18,3.6,.54,6.48l.54,6.3c.12,1.08,.21,1.92,.27,2.52,.06,.6,.09,.96,.09,1.08,.6,1.56,.9,2.7,.9,3.42,0,2.04-.6,3.84-1.8,5.4-1.2,1.56-2.64,2.34-4.32,2.34-3.72,0-5.58-3.72-5.58-11.16Z"/></g></g></g></svg>`,
            }),
            new Gender({
                genderId: "23907da4-c3f2-4e96-a73d-423e64f18a21", // verified
                genderName: "Non-binary",
                genderPronouns: "They/Them",
                genderFlagSvg: "<svg></svg>",
            }),
            new Gender({
                genderId: "3af72545-99d4-4715-812b-c935fbf57f22", // verified
                genderName: "Non-binary",
                genderPronouns: "Ve/Ver",
                genderFlagSvg: "<svg></svg>",
            }),
            new Gender({
                genderId: "6d67e992-c6d1-45be-8316-7a839894bf36", // verified
                genderName: "Non-binary",
                genderPronouns: "Xe/Xem",
                genderFlagSvg: "<svg></svg>",
            }),
            new Gender({
                genderId: "16c10474-9fa6-4eac-aac2-a63423edb757", // verified
                genderName: "Non-binary",
                genderPronouns: "Ze/Zie",
                genderFlagSvg: "<svg></svg>",
            })
        );
    }

    public async getOpennessRecords(): Promise<Openness[]> {
        return new Array<Openness>(
            new Openness({
                opennessId: "ae90b960-5f00-4298-b509-fac92a59b406", // verified
                opennessLevel: -1,
                opennessDescription: "Not Sure",
            }),
            new Openness({
                opennessId: "842b5bd7-1da1-4a95-9564-1fc3b97b3655", // verified
                opennessLevel: 0,
                opennessDescription: "Not Out",
            }),
            new Openness({
                opennessId: "db27c417-a8a5-4703-9b35-9dc76e98fc95", // verified
                opennessLevel: 1,
                opennessDescription: "Out to Few",
            }),
            new Openness({
                opennessId: "822b2622-70d6-4d7c-860a-f56e309fe950", // verified
                opennessLevel: 2,
                opennessDescription: "Semi-Out",
            }),
            new Openness({
                opennessId: "d5c97584-cd1b-4aa6-82ad-b5ddd3577bee", // verified
                opennessLevel: 3,
                opennessDescription: "Fully Out",
            }),
            new Openness({
                opennessId: "77ec4978-6775-4b2f-9e91-ea60bb3742a5", // verified
                opennessLevel: 4,
                opennessDescription: "Ally",
            })
        );
    }
}
