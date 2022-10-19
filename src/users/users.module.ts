import { Module } from "@nestjs/common";
import { UsersRepository } from "./services/usersRepository/users.repository";
import { UsersController } from "./controllers/users.controller";
import { _$ } from "../_domain/injectableTokens";

@Module({
    providers: [
        {
            provide: _$.IUsersRepository,
            useClass: UsersRepository,
        },
    ],
    exports: [
        {
            provide: _$.IUsersRepository,
            useClass: UsersRepository,
        },
    ],
    controllers: [UsersController],
})
export class UsersModule {}
