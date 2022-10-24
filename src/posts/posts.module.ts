import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { DatabaseAccessLayerModule } from "../database-access-layer/database-access-layer.module";
import { GenderRepository } from "../users/services/genderRepository/gender.repository";
import { SexualityRepository } from "../users/services/sexualityRepository/sexuality.repository";
import { _$ } from "../_domain/injectableTokens";
import { PostsController } from "./controllers/posts.controller";
import { PostTagsController } from "./controllers/postTags.controller";
import { PostsRepository } from "./services/postRepository/posts.respository";
import { PostsService } from "./services/posts.service";
import { PostTagsRepository } from "./services/postTagRepository/postTags.repository";
import { PostTypesRepository } from "./services/postTypeRepository/postTypes.repository";

@Module({
    imports: [forwardRef(() => DatabaseAccessLayerModule), HttpModule],
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
    controllers: [PostsController, PostTagsController],
})
export class PostsModule { }
