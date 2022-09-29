import { Test } from "@nestjs/testing";
import { IAuthService } from "../services/auth.service.interface";
import { AuthServiceTest } from "../services/auth.service.test";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
    let authController: AuthController;
    let authService: IAuthService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: "IAuthService",
                    useClass: AuthServiceTest,
                },
            ],
        }).compile();

        authController = moduleRef.get<AuthController>(AuthController);
        authService = moduleRef.get<IAuthService>("IAuthService");
    });

    // describe("signup", () => {
    //     it("should return a message from the signup method", () => {
    //         expect(authController.signup()).toStrictEqual(authService.signup());
    //     });
    // });

    // describe("signin", () => {
    //     it("should return a message from the signin method", () => {
    //         expect(authController.signin()).toStrictEqual(authService.signin());
    //     });
    // });
});
