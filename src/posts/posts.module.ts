import { Module } from "@nestjs/common";
import { PostsController } from './controllers/posts.controller';
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
    controllers: [PostsController],
})
export class PostsModule { }
