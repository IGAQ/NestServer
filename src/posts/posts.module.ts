import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { DatabaseAccessLayerModule } from "../database-access-layer/database-access-layer.module";
import { GenderRepository } from "../users/repositories/gender/gender.repository";
import { SexualityRepository } from "../users/repositories/sexuality/sexuality.repository";
import { _$ } from "../_domain/injectableTokens";
import { PostsController } from "./controllers/posts.controller";
import { PostTagsController } from "./controllers/postTags.controller";
import { PostsRepository } from "./repositories/post/posts.repository";
import { PostsService } from "./services/posts/posts.service";
import { PostTagsRepository } from "./repositories/postTag/postTags.repository";
import { PostTypesRepository } from "./repositories/postType/postTypes.repository";
import { PostAwardRepository } from "./repositories/postAward/postAward.repository";
import { PostTypesController } from "./controllers/postTypes.controller";

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
        {
            provide: _$.IPostAwardRepository,
            useClass: PostAwardRepository,
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
        {
            provide: _$.IPostAwardRepository,
            useClass: PostAwardRepository,
        },
    ],
    controllers: [PostsController, PostTagsController, PostTypesController],
})
export class PostsModule {}
