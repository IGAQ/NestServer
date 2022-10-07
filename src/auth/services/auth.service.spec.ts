import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersServiceTest } from "../../users/services/users.service.test";

describe("AuthService", () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: "IUsersService",
                    useClass: UsersServiceTest,
                },
                JwtService,
                ConfigService,
                {
                    provide: "IAuthService",
                    useClass: AuthService,
                },
            ],
        }).compile();

        service = module.get<AuthService>("IAuthService");
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("they are all giving successful promises", () => {
        it("should return an object with the access_token property", async () => {
            const result = await service.signin({
                username: "john",
                password: "john123", // john123
            });

            expect(result).toHaveProperty("access_token");
        });
    });
});
