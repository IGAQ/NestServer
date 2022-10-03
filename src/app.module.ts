import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PrismaModule } from "./databaseAccessLayer/prisma.module";

@Module({
    imports: [PrismaModule, AuthModule, UsersModule],
})
export class AppModule {}
