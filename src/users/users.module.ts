import { Module } from "@nestjs/common";
import { UsersService } from "./services/UsersService/users.service";
import { UsersController } from "./controllers/users.controller";

@Module({
    providers: [
        {
            provide: "IUsersService",
            useClass: UsersService,
        },
    ],
    exports: [UsersService],
    controllers: [UsersController],
})
export class UsersModule {}
