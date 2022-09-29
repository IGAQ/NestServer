import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import User from "../../models/user";
import { RegisterUserPayloadDto } from "../../models";

describe("UsersService", () => {
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("they are all giving successful promises", () => {
        it("findUserByUsername should be async return an object of User", async () => {
            const result = service.findUserByUsername("testUser");

            expect(result).toBeInstanceOf(Promise);

            const awaitedResult = await result;

            expect(awaitedResult).toBeInstanceOf(User);
        });
        it("findUserById should be async and return an object of User", async () => {
            const result = service.findUserById(1);

            expect(result).toBeInstanceOf(Promise);

            const awaitedResult = await result;

            expect(awaitedResult).toBeInstanceOf(User);
        });
        it("addUser should be async and return nothing", async () => {
            const user = new RegisterUserPayloadDto();
            const result = service.addUser(user);

            expect(result).toBeInstanceOf(Promise);

            await result;
        });
    });
});
