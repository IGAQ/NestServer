import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../neo4j/services/neo4j.service";
import { IPostsRepository } from "../posts/services/postRepository/posts.repository.interface";
import { IPostTypesRepository } from "../posts/services/postTypeRepository/postTypes.repository.interface";
import { IPostTagsRepository } from "../posts/services/postTagRepository/postTags.repository.interface";
import { IUsersRepository } from "../users/services/usersRepository/users.repository.interface";
import { ISexualityRepository } from "../users/services/sexualityRepository/sexuality.repository.interface";
import { IGenderRepository } from "../users/services/genderRepository/gender.repository.interface";
import { _$ } from "../_domain/injectableTokens";

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
        @Inject(_$.IGenderRepository) genderRepository: IGenderRepository
    ) {
        this.neo4jService = neo4jService;

        this.Posts = postsRepository;
        this.PostTypes = postTypesRepository;
        this.PostTags = postTagsRepository;
        this.Users = usersRepository;
        this.Sexualities = sexualityRepository;
        this.Genders = genderRepository;
    }

    public Posts: IPostsRepository;
    public PostTypes: IPostTypesRepository;
    public PostTags: IPostTagsRepository;
    public Users: IUsersRepository;
    public Sexualities: ISexualityRepository;
    public Genders: IGenderRepository;
}
