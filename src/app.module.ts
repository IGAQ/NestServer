import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PrismaModule } from "./databaseAccessLayer/prisma.module";
import { PostsModule } from './posts/posts.module';

@Module({
    imports: [PrismaModule, AuthModule, UsersModule, PostsModule],
})
export class AppModule {}
