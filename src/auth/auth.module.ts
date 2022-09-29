import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { UsersModule } from "../users/users.module";

@Module({
    imports: [UsersModule],
    controllers: [AuthController],
    providers: [
        {
            provide: "IAuthService",
            useClass: AuthService,
        },
    ],
})
export class AuthModule {}
