import { forwardRef, Module } from "@nestjs/common";
import { PostsModule } from "../posts/posts.module";
import { UsersModule } from "../users/users.module";
import { DatabaseContext } from "./databaseContext";
import { _$ } from "../_domain/injectableTokens";

@Module({
    imports: [forwardRef(() => PostsModule), forwardRef(() => UsersModule)],
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
