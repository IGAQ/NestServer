import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role, User } from "../models";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { IUsersService } from "../services/users.service.interface";
import { AuthGuard } from "@nestjs/passport";

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
    constructor(@Inject("IUsersService") private _usersService: IUsersService) {}

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async index(): Promise<User[] | Error> {
        return (await this._usersService.findAll()).map(u => new User(u));
    }

    @Get(":userId")
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async getUserById(
        @Param("userId", new ParseUUIDPipe()) userId: string
    ): Promise<User | Error> {
        const user = await this._usersService.findUserById(userId);
        if (user === undefined) throw new HttpException("User not found", 404);
        return new User(user);
    }

    @Get("/username/:username")
    public async getUserByUsername(@Param("username") username: string): Promise<User | Error> {
        const user = await this._usersService.findUserByUsername(username);
        if (user === undefined) throw new HttpException("User not found", 404);
        return new User(user);
    }
}
