import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { UsersRepository } from "../services/usersRepository/users.repository";
import { _$ } from "../../_domain/injectableTokens";

describe("UsersController", () => {
    let app: INestApplication;
    let usersController: UsersController;

    beforeEach(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: _$.IUsersRepository,
                    useClass: UsersRepository,
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

        usersController = moduleRef.get<UsersController>(UsersController);
    });

    it("should be defined", () => {
        expect(usersController).toBeDefined();
    });

    describe("GET /users", () => {
        describe("Happy Path", () => {
            it("should return an array of users", async () => {
                const result = await request(app.getHttpServer())
                    .get(`/users/`)
                    .set("Accept", "application/json");

                expect(Array.isArray(result.body)).toBe(true);
            });
        });
        describe("Sad Path", () => {});
    });

    describe("GET /users/:id", () => {
        describe("Happy Path", () => {
            let jwtToken: string;
            beforeAll(async () => {
                const result = await request(app.getHttpServer()).post(`/auth/signin`).send({
                    username: "chris",
                    password: "secret",
                });
                jwtToken = result.body.access_token;
                console.log(jwtToken);
            });

            it("should return a user by id", async () => {
                const result = await request(app.getHttpServer())
                    .get(`/users/1`)
                    .set("Accept", "application/json")
                    .set("Authorization", `Bearer ${jwtToken}`);

                expect(result.body).toMatchObject({
                    userId: 1,
                    username: "john",
                    email: "john@gmail.com",
                });

                expect(result.body.password).toBeUndefined();
            });
        });
        describe("Sad Path", () => {
            it("should return 403 if the user is not logged-in.", async () => {
                const result = await request(app.getHttpServer())
                    .get(`/users/666`)
                    .set("Accept", "application/json");

                expect(result.status).toBe(403);
                expect(result.body).toMatchObject({
                    statusCode: 403,
                    message: "Forbidden resource",
                    error: "Forbidden",
                });
            });

            it("should return an error message if the user does not exist userById", async () => {
                const result = await request(app.getHttpServer()).post(`/auth/signin`).send({
                    username: "chris",
                    password: "secret",
                });
                const jwtToken = result.body.access_token;

                const result2 = await request(app.getHttpServer())
                    .get(`/users/666`)
                    .set("Accept", "application/json")
                    .set("Authorization", `Bearer ${jwtToken}`);

                expect(result2.body).toMatchObject({
                    message: "User not found",
                    statusCode: 404,
                });
            });
        });
    });

    describe("GET /users/:username", () => {
        describe("Happy Path", () => {
            it("should return a user by username", async () => {
                const result = await request(app.getHttpServer())
                    .get(`/users/username/john`)
                    .set("Accept", "application/json");

                expect(result.body).toMatchObject({
                    userId: 1,
                    username: "john",
                    email: "john@gmail.com",
                });

                expect(result.body.password).toBeUndefined();
            });
        });
        describe("Sad Path", () => {
            it("should return an error message if the user does not exist userByUsername", async () => {
                const result = await request(app.getHttpServer())
                    .get(`/users/username/666`)
                    .set("Accept", "application/json");

                expect(result.body).toMatchObject({
                    message: "User not found",
                    statusCode: 404,
                });
            });
        });
    });
});
