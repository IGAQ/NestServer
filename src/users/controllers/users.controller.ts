import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import User from "../models/User";
import { UsersService } from "../services/UsersService/users.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
    /**
     *
     */
    constructor(@Inject("IUsersService") private _usersService: UsersService) {}

    @Get()
    public async index(): Promise<User[]> {
        throw new Error("Not Implemented");
        // return this._usersService.getAll();
    }
}
