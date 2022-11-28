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
        const postTypes = await this.getPostTypes();
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
        const postTags = await this.getPostTags();
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
                    postTypeName: postEntity.postType.postTypeName.trim().toLowerCase(),

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
            [UserToPostRelTypes.REPORTED]: {
                records: [],
                relType: UserToPostRelTypes.REPORTED,
            },
        };

        return new Array<User>(
            new User({
                userId: "c612c987-6825-473c-882f-129f17d906b4",
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                avatar: ":^)",
                bio: "My name is gabriel.",
                username: "gabriel",
                normalizedUsername: "GABRIEL",
                passwordHash: "someotherpassword",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "email@domain.com",
                emailVerified: false,
                level: 0,
                roles: [Role.USER],
                gender: new Gender({
                    genderId: "d2945763-d1fb-46aa-b896-7f701b4ca699",
                }),
                isGenderPrivate: false,
                sexuality: new Sexuality({
                    sexualityId: "55da84cc-5f17-454a-a653-227458763edb",
                }),
                isSexualityPrivate: false,
                openness: new Openness({
                    opennessId: "c8921055-563f-4a54-8773-b408efcfb7ac",
                }),
                isOpennessPrivate: false,
                posts: {
                    [UserToPostRelTypes.AUTHORED]: {
                        records: (await this.getPosts()).slice(0, 2).map(post => ({
                            entity: post,
                            relProps: new AuthoredProps({
                                authoredAt: new Date("10/11/2022").getTime(),
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
                bio: "My name is alphonse.",
                username: "alphonse",
                normalizedUsername: "ALPHONSE",
                passwordHash: "num3r1ca1pa55w0rd",
                phoneNumber: null,
                phoneNumberVerified: false,
                email: "admin@domain.com",
                emailVerified: false,
                level: 0,
                roles: [Role.USER],
                gender: new Gender({
                    genderId: "585d31aa-d5b3-4b8d-9690-ffcd57ce2862",
                }),
                isGenderPrivate: false,
                sexuality: new Sexuality({
                    sexualityId: "d2945763-d1fb-46aa-b896-7f701b4ca699",
                }),
                isSexualityPrivate: false,
                openness: new Openness({
                    opennessId: "d5c97584-cd1b-4aa6-82ad-b5ddd3577bee",
                }),
                isOpennessPrivate: false,
                posts: {
                    [UserToPostRelTypes.AUTHORED]: {
                        records: (await this.getPosts()).slice(1, 3).map(post => ({
                            entity: post,
                            relProps: new AuthoredProps({
                                authoredAt: new Date("09/6/2022").getTime(),
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
                postId: "bcddeb57-939d-441b-b4ea-71e1d2055f32",
                postTitle: "Sister caught me checking out a guy on a camping trip",
                postContent:
                    "I was on a camping trip and my sister caught me staring at someone across the site with his \n" +
                    " shirt off, for the the rest of the day she wouldn't stop asking me, even getting the other members \n" +
                    " who came with us to join in, I eventually gave in, she was super kind about it and came out as Bisexual the following months",
                updatedAt: 1666690000,
                postType: (await this.getPostTypes())[1],
                postTags: (await this.getPostTags()).slice(-1),
                restrictedProps: null,
                authorUser: new User({
                    userId: "c612c987-6825-473c-882f-129f17d906b4",
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
                postId: "be9ab5e4-eb7c-469b-a1e3-592dca2a00d0",
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
                updatedAt: 1666770000,
                postType: (await this.getPostTypes())[1],
                postTags: (await this.getPostTags()).slice(0, 1),
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
                        records: (await this.getAwards()).slice(-1, 1).map(award => ({
                            entity: award,
                            relProps: new HasAwardProps({
                                awardedBy: "6bd7b8a2-bf8c-49e6-9c28-ee3d89be2453",
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
                commentId: "f8959b32-5b68-4f68-97bc-59afdc0d09cb",
                parentId: "bcddeb57-939d-441b-b4ea-71e1d2055f32",
                commentContent: "Wow that's so nice to hear!",
                createdAt: 1666990000,
                updatedAt: 1666990000,
                authorUser: new User({
                    userId: "6bd7b8a2-bf8c-49e6-9c28-ee3d89be2453",
                }),
                pinned: true,
                pending: false,
                restrictedProps: null,
                childComments: [],
            }),
            new Comment({
                commentId: "c13c4349-bbf9-45a7-a573-7a04efa66e3c",
                parentId: "be9ab5e4-eb7c-469b-a1e3-592dca2a00d0",
                commentContent: `Congratulations! That's so nice you have such a supportive family. 
                                Sorry to hear about your ex-girlfriend and your cousin though. I hope you're doing better now.`,
                createdAt: 1666890000,
                updatedAt: 1666890000,
                authorUser: new User({
                    userId: "6bd7b8a2-bf8c-49e6-9c28-ee3d89be2453",
                }),
                pinned: false,
                pending: true,
                restrictedProps: null,
                childComments: [
                    new Comment({
                        commentId: "3ee2801a-998d-437a-a49e-3974919f35c1",
                        parentId: "be9ab5e4-eb7c-469b-a1e3-592dca2a00d0",
                        commentContent: `Wow that's so scummy of your cousin to do that to you! I would have never forgiven her.`,
                        createdAt: 1666990000,
                        updatedAt: 1666990000,
                        authorUser: new User({
                            userId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                        }),
                        pinned: false,
                        pending: true,
                        restrictedProps: null,
                        childComments: [
                            new Comment({
                                commentId: "287ca219-005e-41fa-af40-abf59c2c2caf",
                                parentId: "3ee2801a-998d-437a-a49e-3974919f35c1",
                                commentContent: `I agree! I would have never forgiven her either.`,
                                createdAt: 1667000000,
                                updatedAt: 1667000000,
                                authorUser: new User({
                                    userId: "f0b42305-9513-4fe7-a918-320d2b488e61",
                                }),
                                pinned: false,
                                pending: true,
                                restrictedProps: new RestrictedProps({
                                    restrictedAt: 1667000001,
                                    moderatorId: "3109f9e2-a262-4aef-b648-90d86d6fbf6c",
                                    reason: "The moderator died of cringe",
                                }),
                                childComments: [],
                            }),
                        ],
                    }),
                ],
            })
        );
    }

    public async getPostTypes(): Promise<PostType[]> {
        return new Array<PostType>(
            new PostType({
                postTypeName: "queery",
            }),
            new PostType({
                postTypeName: "story",
            })
        );
    }

    public async getPostTags(): Promise<PostTag[]> {
        return new Array<PostTag>(
            new PostTag({
                tagName: "Serious",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagName: "Advice",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagName: "Discussion",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagName: "Trigger",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagName: "General",
                tagColor: "#FF758C",
            }),
            new PostTag({
                tagName: "Casual",
                tagColor: "#FF758C",
            })
        );
    }

    public async getAwards(): Promise<Award[]> {
        return new Array<Award>(
            new Award({
                awardId: "032930d2-9994-46cc-ad35-559bb41a9d05",
                awardName: "Ian's Mom Award",
                awardSvg: "<svg></svg>",
            }),
            new Award({
                awardId: "375608ce-ca65-4293-8402-da34cd2c42c7",
                awardName: "",
                awardSvg: "<svg></svg>",
            }),
            new Award({
                awardId: "bf99f8f5-66f7-41ce-8014-5f70e5145174",
                awardName: "Ilia's Mom Award",
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
