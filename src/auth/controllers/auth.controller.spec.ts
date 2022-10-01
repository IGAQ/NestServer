import { Test } from "@nestjs/testing";
import { AuthServiceTest } from "../services/auth.service.test";
import { AuthController } from "./auth.controller";
import { UsersService } from "../../users/services/usersService/users.service";
import { AuthDto } from "../models";

describe("AuthController", () => {
    let authController: AuthController;
    // let authService: IAuthService;
    // let usersService: UsersService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                UsersService,
                {
                    provide: "IAuthService",
                    useClass: AuthServiceTest,
                },
                {
                    provide: "IUsersService",
                    useClass: UsersService,
                },
            ],
        }).compile();

        // usersService = moduleRef.get<UsersService>(UsersService);
        authController = moduleRef.get<AuthController>(AuthController);
        // authService = moduleRef.get<IAuthService>("IAuthService");
    });

    describe("signin", () => {
        it("if signin is successful, should return a success message", async () => {
            const dto = new AuthDto();
            dto.email = "chris@gmail.com";
            dto.password = "secret";
            dto.username = "chris";
            expect(
                await authController.signin({
                    email: dto.email,
                    password: dto.password,
                    username: dto.username,
                })
            ).toEqual({ msg: "I am signed in" });
        });
    });

    describe("signup", () => {
        it("if signup is successful, should return a success message", async () => {
            const dto = new AuthDto();
            dto.email = "ian@gmail.com";
            dto.password = "ian123";
            dto.username = "ian";
            expect(
                await authController.signup({
                    email: dto.email,
                    password: dto.password,
                    username: dto.username,
                })
            ).toEqual({ msg: "I am signed up" });
        });
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
