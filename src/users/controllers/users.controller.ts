import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserDto } from "../models";
import { UsersServiceTest } from "../services/users.service.test";

@ApiTags("users")
@Controller("users")
export class UsersController {
    /**
     *
     */
    constructor(@Inject("IUsersService") private _usersService: UsersServiceTest) {}

    @Get()
    public async index(): Promise<UserDto[]> {
        return await this._usersService.findAll();
    }
}
