import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../neo4j/services/neo4j.service";
import { IPostsRepository } from "../posts/services/postRepository/posts.repository.inerface";
import { IPostTagsRepository } from "../posts/services/postTagRepository/postTags.repository.interface";
import { IUsersRepository } from "../users/services/usersRepository/users.repository.interface";
import { ISexualityRepository } from "../users/services/sexualityRepository/sexuality.repository.interface";
import { IGenderRepository } from "../users/services/genderRepository/gender.repository.interface";
import { _$ } from "../_domain/injectableTokens";

@Injectable()
export class DatabaseContext {
    private readonly _neo4jService: Neo4jService;

    constructor(
        neo4jService: Neo4jService,
        @Inject(_$.IPostsRepository) postsRepository: IPostsRepository,
        @Inject(_$.IPostTagsRepository) postTagsRepository: IPostTagsRepository,
        @Inject(_$.IUsersRepository) usersRepository: IUsersRepository,
        @Inject(_$.ISexualityRepository) sexualityRepository: ISexualityRepository,
        @Inject(_$.IGenderRepository) genderRepository: IGenderRepository) {
        this._neo4jService = neo4jService;

        this.Posts = postsRepository;
        this.PostTags = postTagsRepository;
        this.Users = usersRepository;
        this.Sexualities = sexualityRepository;
        this.Genders = genderRepository;
    }

    public Posts: IPostsRepository;
    public PostTags: IPostTagsRepository;
    public Users: IUsersRepository;
    public Sexualities: ISexualityRepository;
    public Genders: IGenderRepository;

}