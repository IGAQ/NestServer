import { Test } from "@nestjs/testing";
import { UsersServiceTest } from "../../users/services/users.service.test";
import { AuthServiceTest } from "../services/auth.service.test";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
    let authController: AuthController;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                UsersServiceTest,
                {
                    provide: "IAuthService",
                    useClass: AuthServiceTest,
                },
                {
                    provide: "IUsersService",
                    useClass: UsersServiceTest,
                },
            ],
        }).compile();

        authController = moduleRef.get<AuthController>(AuthController);
    });

    describe("signin", () => {
        it("if signin is successful, should return a success message", async () => {
            expect(
                await authController.signin({
                    email: "chris@gmail.com",
                    password: "secret",
                    username: "chris",
                })
            ).toEqual({ msg: "I am signed in" });
        });
        it("if signin user does not exist, should return an error message", async () => {
            expect(
                await authController.signin({
                    email: "bob@gmail.com",
                    password: "secret",
                    username: "bob",
                })
            ).toEqual({ msg: "User not found" });
        });
        it("if signin password is incorrect, should return an error message", async () => {
            expect(
                await authController.signin({
                    email: "chris@gmail.com",
                    password: "wrongpassword",
                    username: "chris",
                })
            ).toEqual({ msg: "Incorrect password" });
        });
    });

    // describe("signup", () => {
    //     it("if signup is successful, should return a success message", async () => {
    //         expect(
    //             await authController.signup({
    //                 email: "ian@gmail.com",
    //                 password: "ian123",
    //                 username: "ian",
    //             })
    //         ).toEqual({ msg: "I am signed up" });
    //     });
    // });

    // describe("bad signup", () => {
    //     it("if signup has invalid email, should return an error message", async () => {
    //         const dto = new AuthDto();
    //         dto.email = "ian";
    //         dto.password = "ian123";
    //         dto.username = "";
    //         expect(
    //             await authController.signup({
    //                 email: dto.email,
    //                 password: dto.password,
    //                 username: dto.username,
    //             })
    //         ).toEqual({
    //             statusCode: 400,
    //             message: ["email must be an email"],
    //             error: "Bad Request",
    //         });
    //     });
    // });
});
