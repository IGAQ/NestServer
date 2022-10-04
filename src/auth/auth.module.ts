import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { UsersModule } from "../users/users.module";
import { RolesGuard } from "./guards/roles.guard";

@Module({
    imports: [UsersModule],
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
