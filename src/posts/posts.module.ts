import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { DatabaseAccessLayerModule } from "../database-access-layer/database-access-layer.module";
import { _$ } from "../_domain/injectableTokens";
import { PostsController } from "./controllers/posts.controller";
import { PostTagsController } from "./controllers/postTags.controller";
import { PostsRepository } from "./repositories/post/posts.repository";
import { PostsService } from "./services/posts/posts.service";
import { PostTagsRepository } from "./repositories/postTag/postTags.repository";
import { PostTypesRepository } from "./repositories/postType/postTypes.repository";
import { PostAwardRepository } from "./repositories/postAward/postAward.repository";
import { PostTypesController } from "./controllers/postTypes.controller";
import { ModerationModule } from "../moderation/moderation.module";
import { PostsReportService } from "./services/postReport/postsReport.service";

@Module({
    imports: [forwardRef(() => DatabaseAccessLayerModule), HttpModule, ModerationModule],
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
            provide: _$.IPostAwardRepository,
            useClass: PostAwardRepository,
        },
        {
            provide: _$.IPostsReportService,
            useClass: PostsReportService,
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
            provide: _$.IPostAwardRepository,
            useClass: PostAwardRepository,
        },
        {
            provide: _$.IPostsReportService,
            useClass: PostsReportService,
        },
    ],
    controllers: [PostsController, PostTagsController, PostTypesController],
})
export class PostsModule {}
