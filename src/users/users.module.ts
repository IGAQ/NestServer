import { Module } from "@nestjs/common";
import { UsersService } from "./services/users.service";
import { UsersController } from "./controllers/users.controller";

@Module({
    providers: [
        {
            provide: "IUsersService",
            useClass: UsersService,
        },
    ],
    exports: [
        {
            provide: "IUsersService",
            useClass: UsersService,
        },
    ],
    controllers: [UsersController],
})
export class UsersModule {}
