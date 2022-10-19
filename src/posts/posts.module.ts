import { Module } from "@nestjs/common";
import { PostsRepository } from "./services/postRepository/posts.respository";
import { PostsController } from "./controllers/posts.controller";
import { _$ } from "../_domain/injectableTokens";

@Module({
    providers: [
        {
            provide: _$.IPostsRepository,
            useClass: PostsRepository,
        },
    ],
    exports: [
        {
            provide: _$.IPostsRepository,
            useClass: PostsRepository,
        },
    ],
    controllers: [PostsController],
})
export class PostsModule {}
