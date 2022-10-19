import { Module } from "@nestjs/common";
import { PostsController } from "./controllers/posts.controller";
import { PostsRepository } from "./services/postRepository/posts.respository";
import { _$ } from "../_domain/injectableTokens";
import { PostsService } from "./services/posts.service";

@Module({
    providers: [
        {
            provide: _$.IPostsRepository,
            useClass: PostsRepository,
        },
        {
            provide: _$.IPostsService,
            useClass: PostsService,
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
    ],
    controllers: [PostsController],
})
export class PostsModule {}
