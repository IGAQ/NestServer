import { Module } from "@nestjs/common";
import { UsersRepository } from "./services/users.repository";
import { UsersController } from "./controllers/users.controller";

@Module({
    providers: [
        {
            provide: "IUsersRepository",
            useClass: UsersRepository,
        },
    ],
    exports: [
        {
            provide: "IUsersRepository",
            useClass: UsersRepository,
        },
    ],
    controllers: [UsersController],
})
export class UsersModule {}
