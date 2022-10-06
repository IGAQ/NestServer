import { Test, TestingModule } from "@nestjs/testing";
import { UsersServiceTest } from "./users.service.test";
import { UserDto } from "../models";
import { RegisterUserPayloadDto } from "../models";

describe("UsersServiceTest", () => {
    let service: UsersServiceTest;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: "IUsersService",
                    useClass: UsersServiceTest,
                },
            ],
        }).compile();

        service = module.get<UsersServiceTest>("IUsersService");
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("they are all giving successful promises", () => {
        it("findUserByUsername should be async return an object of User", async () => {
            const result = service.findUserByUsername("john");

            expect(result).toBeInstanceOf(Promise);

            const awaitedResult = await result;

            console.log(awaitedResult);
            expect(awaitedResult).toMatchObject({
                userId: 1,
                username: "john",
                email: "john@gmail.com",
            });
        });
        it("findUserById should be async and return an object of User", async () => {
            const result = service.findUserById(1);

            expect(result).toBeInstanceOf(Promise);

            const awaitedResult = await result;

            expect(awaitedResult).toMatchObject({
                userId: 1,
                username: "john",
                email: "john@gmail.com",
            });
        });
        it("addUser should be async and return nothing", async () => {
            const user = new RegisterUserPayloadDto();
            const result = service.addUser(user);

            expect(result).toBeInstanceOf(Promise);

            await result;
        });
    });
});