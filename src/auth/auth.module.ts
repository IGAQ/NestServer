import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { UsersModule } from "../users/users.module";
import { RolesGuard } from "./guards/roles.guard";
import { jwtConstants } from "./constants";

@Module({
    imports: [
        UsersModule,
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: "15m" },
        }),
    ],
    controllers: [AuthController],
    providers: [
        {
            provide: "IAuthService",
            useClass: AuthService,
        },
        RolesGuard,
    ],
    exports: [RolesGuard],
})
export class AuthModule {}
