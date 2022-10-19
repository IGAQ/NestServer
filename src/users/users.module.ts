import { forwardRef, Module } from "@nestjs/common";
import { UsersRepository } from "./services/usersRepository/users.repository";
import { UsersController } from "./controllers/users.controller";
import { _$ } from "../_domain/injectableTokens";
import { DatabaseAccessLayerModule } from "../database-access-layer/database-access-layer.module";

@Module({
    imports: [forwardRef(() => DatabaseAccessLayerModule)],
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
