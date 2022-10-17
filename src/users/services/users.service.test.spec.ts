import { Test, TestingModule } from "@nestjs/testing";
import { UsersRepositoryTest } from "./users.repository.test";
import { RegisterUserPayloadDto } from "../models";

describe("UsersServiceTest", () => {
    let service: UsersRepositoryTest;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: "IUsersRepository",
                    useClass: UsersRepositoryTest,
                },
            ],
        }).compile();

        service = module.get<UsersRepositoryTest>("IUsersRepository");
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
            const result = service.findUserById("1");

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
