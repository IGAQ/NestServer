import { forwardRef, Module } from "@nestjs/common";
import { PostsModule } from "../posts/posts.module";
import { UsersModule } from "../users/users.module";
import { DatabaseContext } from "./databaseContext";
import { _$ } from "../_domain/injectableTokens";
import { CommentsModule } from "../comments/comments.module";

@Module({
    imports: [
        forwardRef(() => PostsModule),
        forwardRef(() => UsersModule),
        forwardRef(() => CommentsModule),
    ],
    providers: [
        {
            provide: _$.IDatabaseContext,
            useClass: DatabaseContext,
        },
    ],
    exports: [
        {
            provide: _$.IDatabaseContext,
            useClass: DatabaseContext,
        },
    ],
})
export class DatabaseAccessLayerModule {}
