import { forwardRef, Module } from "@nestjs/common";
import { PostsController } from "./controllers/posts.controller";
import { PostsRepository } from "./services/postRepository/posts.respository";
import { _$ } from "../_domain/injectableTokens";
import { PostsService } from "./services/posts.service";
import { DatabaseAccessLayerModule } from "../database-access-layer/database-access-layer.module";
import { PostTagsRepository } from "./services/postTagRepository/postTags.repository";
import { GenderRepository } from "../users/services/genderRepository/gender.repository";
import { SexualityRepository } from "../users/services/sexualityRepository/sexuality.repository";
import { PostTypesRepository } from "./services/postTypeRepository/postTypes.repository";

@Module({
    imports: [forwardRef(() => DatabaseAccessLayerModule)],
    providers: [
        {
            provide: _$.IPostsRepository,
            useClass: PostsRepository,
        },
        {
            provide: _$.IPostsService,
            useClass: PostsService,
        },
        {
            provide: _$.IPostTagsRepository,
            useClass: PostTagsRepository,
        },
        {
            provide: _$.IPostTypesRepository,
            useClass: PostTypesRepository,
        },
        {
            provide: _$.IGenderRepository,
            useClass: GenderRepository,
        },
        {
            provide: _$.ISexualityRepository,
            useClass: SexualityRepository,
        },
    ],
    exports: [
        {
            provide: _$.IPostsRepository,
            useClass: PostsRepository,
        },
        {
            provide: _$.IPostsService,
            useClass: PostsService,
        },
        {
            provide: _$.IPostTagsRepository,
            useClass: PostTagsRepository,
        },
        {
            provide: _$.IPostTypesRepository,
            useClass: PostTypesRepository,
        },
        {
            provide: _$.IGenderRepository,
            useClass: GenderRepository,
        },
        {
            provide: _$.ISexualityRepository,
            useClass: SexualityRepository,
        },
    ],
    controllers: [PostsController],
})
export class PostsModule {}
