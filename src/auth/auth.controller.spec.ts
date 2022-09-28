import { Test } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
    let authController: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [AuthService],
        }).compile();

        authController = moduleRef.get<AuthController>(AuthController);
        authService = moduleRef.get<AuthService>(AuthService);
    });

    describe("signup", () => {
        it("should return a message from the signup method", () => {
            expect(authController.signup()).toStrictEqual(authService.signup());
        });
    });

    describe("signin", () => {
        it("should return a message from the signin method", () => {
            expect(authController.signin()).toStrictEqual(authService.signin());
        });
    });
});
