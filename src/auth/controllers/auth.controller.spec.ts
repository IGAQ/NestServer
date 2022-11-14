import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AuthController } from "./auth.controller";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { SignInPayloadDto, SignTokenDto, SignUpPayloadDto } from "../dtos";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersRepository } from "../../users/repositories/users/users.repository";
import { _$ } from "../../_domain/injectableTokens";

describe("AuthController", () => {
    let app: INestApplication;
    let authController: AuthController;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                JwtService,
                ConfigService,
                {
                    provide: _$.IUsersRepository,
                    useClass: UsersRepository,
                },
                {
                    provide: _$.IAuthService,
                    useClass: AuthService,
                },
            ],
        }).compile();

        app = moduleRef.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
            })
        );
        await app.init();

        authController = moduleRef.get<AuthController>(AuthController);
    });

    describe("authController", () => {
        it("should be defined", () => {
            expect(authController).toBeDefined();
        });
    });

    // describe("signIn", () => {
    //     it("if signIn is successful, should return a jwt token", async () => {
    //         const result = await request(app.getHttpServer())
    //             .post(`/auth/signin`)
    //             .send({
    //                 email: "chris@gmail.com",
    //                 password: "secret",
    //                 username: "chris",
    //             })
    //             .set("Accept", "application/json");
    //         expect(result.body).toBeDefined();
    //         expect(typeof result.body).toBe("object");
    //         expect(result.body).toHaveProperty("access_token");
    //     });
    //     it("if signIn user does not exist, should return an error message", async () => {
    //         const result = await request(app.getHttpServer())
    //             .post(`/auth/signin`)
    //             .send({
    //                 email: "bob@gmail.com",
    //                 password: "secret",
    //                 username: "bob",
    //             })
    //             .set("Accept", "application/json");
    //         expect(typeof result.body).toBe("object");
    //         expect(result.body).toHaveProperty("message");
    //         expect(result.body.message).toBe("User not found");
    //     });
    //     it("if signin password is incorrect, should return an error message", async () => {
    //         const result = await request(app.getHttpServer())
    //             .post(`/auth/signin`)
    //             .send({
    //                 email: "chris@gmail.com",
    //                 password: "wrongpassword",
    //                 username: "chris",
    //             })
    //             .set("Accept", "application/json");
    //         expect(typeof result.body).toBe("object");
    //         expect(result.body).toHaveProperty("message");
    //         expect(result.body.message).toBe("Incorrect password");
    //     });
    // });

    // describe("signup", () => {
    //     it("if signup is successful, should return a success message", async () => {
    //         const result = await request(app.getHttpServer())
    //             .post(`/auth/signup`)
    //             .send({
    //                 email: "ian@gmail.com",
    //                 password: "ian123",
    //                 username: "ian",
    //             })
    //             .set("Accept", "application/json");

    //         expect(result.body).toBeDefined();
    //         expect(typeof result.body).toBe("object");
    //         expect(result.body).toHaveProperty("access_token");
    //     });
    // });

    // describe("bad signup", () => {
    //     it("if signup has invalid email, should return an error message", async () => {
    //         const dto = new AuthDto({
    //             email: "ian",
    //             password: "ian123",
    //             username: "ian",
    //         });

    //         const result = await request(app.getHttpServer())
    //             .post(`/auth/signup`)
    //             .send(dto)
    //             .set("Accept", "application/json");

    //         expect(result.body).toMatchObject({
    //             statusCode: 400,
    //             message: ["email must be an email"],
    //             error: "Bad Request",
    //         });
    //     });
    // });
});
