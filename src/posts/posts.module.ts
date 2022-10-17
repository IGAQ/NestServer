import { Module } from "@nestjs/common";
import { PostsRepository } from "./services/postRepository/posts.respository";

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
    controllers: [],
})
export class PostsModule {}
