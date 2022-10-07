import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./controllers/auth.controller";
import { RolesGuard } from "./guards/roles.guard";
import { AuthService } from "./services/auth.service";
import { JwtStrategy } from "./strategy";

@Module({
    imports: [UsersModule, JwtModule.register({})],
    controllers: [AuthController],
    providers: [
        {
            provide: "IAuthService",
            useClass: AuthService,
        },
        RolesGuard,
        JwtStrategy,
    ],
    exports: [RolesGuard],
})
export class AuthModule {}
