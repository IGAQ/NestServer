import { Module } from '@nestjs/common';
import { PostsModule } from "../posts/posts.module";
import { UsersModule } from "../users/users.module";
import { DatabaseContext } from "./databaseContext";
import { _$ } from "../_domain/injectableTokens";

@Module({
    imports: [PostsModule, UsersModule],
    exports: [
        {
            provide: _$.IDatabaseContext,
            useClass: DatabaseContext,
        }
    ]
})
export class DatabaseAccessLayerModule {}
