import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    ParseIntPipe,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role, UserDto } from "../models";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { IUsersService } from "../services/users.service.interface";

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags("users")
@Controller("users")
export class UsersController {
    /**
     *
     */
    constructor(@Inject("IUsersService") private _usersService: IUsersService) {}

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    public async index(): Promise<UserDto[] | Error> {
        return (await this._usersService.findAll()).map(u => new UserDto(u));
    }

    @Get(":userId")
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
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
