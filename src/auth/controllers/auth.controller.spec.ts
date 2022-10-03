import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { UsersServiceTest } from "../../users/services/users.service.test";
import { AuthServiceTest } from "../services/auth.service.test";
import { AuthController } from "./auth.controller";
import { AuthDto } from "../models";
import { INestApplication, ValidationPipe } from "@nestjs/common";

describe("AuthController", () => {
    let app: INestApplication;
    let authController: AuthController;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
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

        app = moduleRef.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
            })
        );
        await app.init();

        authController = moduleRef.get<AuthController>(AuthController);
    });

    describe("signin", () => {
        it("if signin is successful, should return a success message", async () => {
            const result = await request(app.getHttpServer())
                .post(`/auth/signin`)
                .send({
                    email: "chris@gmail.com",
                    password: "secret",
                    username: "chris",
                })
                .set("Accept", "application/json");
            expect(result.body).toEqual({ msg: "I am signed in" });
        });
        it("if signin user does not exist, should return an error message", async () => {
            const result = await request(app.getHttpServer())
                .post(`/auth/signin`)
                .send({
                    email: "bob@gmail.com",
                    password: "secret",
                    username: "bob",
                })
                .set("Accept", "application/json");
            expect(result.body).toMatchObject({ msg: "User not found" });
        });
        it("if signin password is incorrect, should return an error message", async () => {
            const result = await request(app.getHttpServer())
                .post(`/auth/signin`)
                .send({
                    email: "chris@gmail.com",
                    password: "wrongpassword",
                    username: "chris",
                })
                .set("Accept", "application/json");
            expect(result.body).toMatchObject({ msg: "Incorrect password" });
        });
    });

    describe("signup", () => {
        it("if signup is successful, should return a success message", async () => {
            const result = await request(app.getHttpServer())
                .post(`/auth/signup`)
                .send({
                    email: "ian@gmail.com",
                    password: "ian123",
                    username: "ian",
                })
                .set("Accept", "application/json");

            expect(result.body).toMatchObject({ msg: "I am signed up" });
        });
    });

    describe("bad signup", () => {
        it("if signup has invalid email, should return an error message", async () => {
            const dto = new AuthDto();
            dto.email = "ian";
            dto.password = "ian123";
            dto.username = "yo";

            const result = await request(app.getHttpServer())
                .post(`/auth/signup`)
                .send(dto)
                .set("Accept", "application/json");

            expect(result.body).toMatchObject({
                statusCode: 400,
                message: ["email must be an email"],
                error: "Bad Request",
            });
        });
    });
});
