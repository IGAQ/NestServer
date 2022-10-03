import { Module } from "@nestjs/common";
import { UsersServiceTest } from "./services/users.service.test";
import { UsersController } from "./controllers/users.controller";

@Module({
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
