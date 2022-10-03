import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    ParseIntPipe,
    Post,
    UseInterceptors,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserDto } from "../models";
import { UsersServiceTest } from "../services/users.service.test";

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags("users")
@Controller("users")
export class UsersController {
    /**
     *
     */
    constructor(@Inject("IUsersService") private _usersService: UsersServiceTest) {}

    @Get()
    public async index(): Promise<UserDto[] | Error> {
        return (await this._usersService.findAll()).map(u => new UserDto(u));
    }

    @Get(":userId")
    public async getUserById(
        @Param("userId", new ParseIntPipe()) userId: number
    ): Promise<UserDto | Error> {
        const user = await this._usersService.findUserById(userId);
        if (user === undefined) throw new HttpException("User not found", 404);
        return new UserDto(user);
    }

    @Get("/username/:username")
    public async getUserByUsername(@Param("username") username: string): Promise<UserDto | Error> {
        const user = await this._usersService.findUserByUsername(username);
        if (user === undefined) throw new HttpException("User not found", 404);
        return new UserDto(user);
    }
}
