import { Module } from "@nestjs/common";
import { UsersServiceTest } from "./services/usersService/users.service.test";
import { UsersController } from "./controllers/users.controller";
import { PrismaModule } from "../databaseAccessLayer/prisma.module";

@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: "IUsersService",
            useClass: UsersServiceTest,
        },
    ],
    exports: [
        {
            provide: "IUsersService",
            useClass: UsersServiceTest,
        },
    ],
    controllers: [UsersController],
})
export class UsersModule {}
