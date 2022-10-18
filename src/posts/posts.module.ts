import { Module } from "@nestjs/common";
import { PostsRepository } from "./services/postRepository/posts.respository";
import { PostsController } from "./controllers/posts.controller";

@Module({
    providers: [
        {
            provide: "IPostsRepository",
            useClass: PostsRepository,
        },
    ],
    exports: [
        {
            provide: "IPostsRepository",
            useClass: PostsRepository,
        },
    ],
    controllers: [PostsController],
})
export class PostsModule {}
