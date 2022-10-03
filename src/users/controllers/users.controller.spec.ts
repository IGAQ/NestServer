import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersServiceTest } from "../services/users.service.test";

describe("UsersController", () => {
    let controller: UsersController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: "IUsersService",
                    useClass: UsersServiceTest,
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
