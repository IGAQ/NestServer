import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersServiceTest } from "../../users/services/users.service.test";
import { SignInPayloadDto } from "../models";

describe("AuthService", () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: "IUsersService",
                    useClass: UsersServiceTest,
                },
                JwtService,
                ConfigService,
                {
                    provide: "IAuthService",
                    useClass: AuthService,
                },
            ],
        }).compile();

        service = module.get<AuthService>("IAuthService");
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("IAuthService.signToken", () => {
        describe("happy path",() => {
            let result;

            beforeAll(async () => {
                result = await service.signIn(new SignInPayloadDto({
                    username: "john",
                    password: "john123", // john123
                }));
            });

            it("should return an object with the access_token property", async () => {
                expect(result).toHaveProperty("access_token");
            });

            it("access_token property value has to be a string and be semantically valid.", () => {
                expect(typeof result.access_token).toBe("string");
                expect(result.access_token).toMatch(
                    /^[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+.[A-Za-z0-9-_.+/=]*$/
                );
            });
        });

        describe("sad path", () => {
            let result;
            let exception;

            const makeResult = async (signInPayloadDto: SignInPayloadDto) => {
                try {
                    result = await service.signIn(new SignInPayloadDto(signInPayloadDto));
                } catch (error) {
                    exception = error;
                }
            };

            it("should throw an error when the password is wrong", async () => {
                await makeResult(new SignInPayloadDto({
                    username: "john",
                    password: "john1234", // john123
                }));
                expect(exception).toBeDefined();
                expect(exception.message).toBe("Incorrect password");
            });

            it("should throw an error when the username is wrong", async () => {
                await makeResult(new SignInPayloadDto({
                    username: "john1",
                    password: "john123", // john123
                }));
                expect(exception).toBeDefined();
                expect(exception.message).toBe("User not found");
            });
        });
    });
});
