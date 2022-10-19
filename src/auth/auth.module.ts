import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./controllers/auth.controller";
import { RolesGuard } from "./guards/roles.guard";
import { AuthService } from "./services/auth.service";
import { JwtStrategy } from "./strategy";
import { _$ } from "../_domain/injectableTokens";
import { DatabaseAccessLayerModule } from "../database-access-layer/database-access-layer.module";

@Module({
    imports: [forwardRef(() => DatabaseAccessLayerModule), UsersModule, JwtModule.register({})],
    controllers: [AuthController],
    providers: [
        {
            provide: _$.IAuthService,
            useClass: AuthService,
        },
        RolesGuard,
        JwtStrategy,
    ],
    exports: [RolesGuard],
})
export class AuthModule {}
