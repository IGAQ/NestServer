import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersServiceTest } from "../services/users.service.test";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";

describe("UsersController", () => {
    let app: INestApplication;
    let usersController: UsersController;

    beforeEach(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: "IUsersService",
                    useClass: UsersServiceTest,
                },
            ],
        }).compile();

        app = moduleRef.createNestApplication();

        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
        }));
        await app.init();

        usersController = moduleRef.get<UsersController>(UsersController);
    });

    it("should be defined", () => {
        expect(usersController).toBeDefined();
    });

    describe("they are all giving successful promises", () => {
        it("should return an array of users", async () => {
            const result = await request(app.getHttpServer())
                .get(`/users/`)
                .set('Accept', 'application/json');

            expect(Array.isArray(result.body)).toBe(true);
        });

        it("should return a user by id", async () => {
            const result = await request(app.getHttpServer())
                .get(`/users/1`)
                .set('Accept', 'application/json');

            expect(result.body).toMatchObject({
                userId: 1,
                username: "john",
                email: "john@gmail.com",
            });

            expect(result.body.password).toBeUndefined();
        });

        it("should return a user by username", async () => {
            const result = await request(app.getHttpServer())
                .get(`/users/username/john`)
                .set('Accept', 'application/json');

            expect(result.body).toMatchObject({
                userId: 1,
                username: "john",
                email: "john@gmail.com",
            });

            expect(result.body.password).toBeUndefined();
        });
    });

    describe("they are all giving rejected promises", () => {
        it("should return an error message if the user does not exist userById", async () => {
            const result = await request(app.getHttpServer())
                .get(`/users/666`)
                .set('Accept', 'application/json');

            expect(result.body).toMatchObject({
                message: "User not found",
                statusCode: 404,
            });
        });

        it("should return an error message if the user does not exist userByUsername", async () => {
            const result = await request(app.getHttpServer())
                .get(`/users/username/666`)
                .set('Accept', 'application/json');

            expect(result.body).toMatchObject({
                message: "User not found",
                statusCode: 404,
            });
        });
    });
});
