import { Inject, Injectable } from "@nestjs/common";
import { ICommentsRepository } from "../comments/repositories/comment/comments.repository.interface";
import { Neo4jService } from "../neo4j/services/neo4j.service";
import { IPostsRepository } from "../posts/repositories/post/posts.repository.interface";
import { IPostTagsRepository } from "../posts/repositories/postTag/postTags.repository.interface";
import { IPostTypesRepository } from "../posts/repositories/postType/postTypes.repository.interface";
import { IGenderRepository } from "../users/repositories/gender/gender.repository.interface";
import { ISexualityRepository } from "../users/repositories/sexuality/sexuality.repository.interface";
import { IUsersRepository } from "../users/repositories/users/users.repository.interface";
import { _$ } from "../_domain/injectableTokens";
import { IOpennessRepository } from "../users/repositories/openness/openness.repository.interface";

@Injectable()
export class DatabaseContext {
    public readonly neo4jService: Neo4jService;

    constructor(
        neo4jService: Neo4jService,
        @Inject(_$.IPostsRepository) postsRepository: IPostsRepository,
        @Inject(_$.IPostTypesRepository) postTypesRepository: IPostTypesRepository,
        @Inject(_$.IPostTagsRepository) postTagsRepository: IPostTagsRepository,
        @Inject(_$.IUsersRepository) usersRepository: IUsersRepository,
        @Inject(_$.ISexualityRepository) sexualityRepository: ISexualityRepository,
        @Inject(_$.IGenderRepository) genderRepository: IGenderRepository,
        @Inject(_$.IOpennessRepository) opennessRepository: IOpennessRepository,
        @Inject(_$.ICommentsRepository) commentsRepository: ICommentsRepository
    ) {
        this.neo4jService = neo4jService;

        this.Posts = postsRepository;
        this.PostTypes = postTypesRepository;
        this.PostTags = postTagsRepository;
        this.Users = usersRepository;
        this.Sexualities = sexualityRepository;
        this.Openness = opennessRepository;
        this.Genders = genderRepository;
        this.Comments = commentsRepository;
    }

    public Posts: IPostsRepository;
    public PostTypes: IPostTypesRepository;
    public PostTags: IPostTagsRepository;
    public Users: IUsersRepository;
    public Sexualities: ISexualityRepository;
    public Openness: IOpennessRepository;
    public Genders: IGenderRepository;
    public Comments: ICommentsRepository;
}
