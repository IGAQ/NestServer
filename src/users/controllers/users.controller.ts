import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { _$ } from "../../_domain/injectableTokens";
import { Role, User } from "../models";
import { IUsersRepository } from "../services/usersRepository/users.repository.interface";

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
    constructor(@Inject(_$.IUsersRepository) private _usersRepository: IUsersRepository) { }

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async index(): Promise<User[] | Error> {
        const users = await this._usersRepository.findAll();
        const decoratedUsers = users.map(user => user.toJSON());
        return await Promise.all(decoratedUsers);
    }

    @Get(":userId")
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async getUserById(
        @Param("userId", new ParseUUIDPipe()) userId: string
    ): Promise<User | Error> {
        const user = await this._usersRepository.findUserById(userId);
        if (user === undefined) throw new HttpException("User not found", 404);
        return user;
    }

    @Get("/username/:username")
    public async getUserByUsername(@Param("username") username: string): Promise<User | Error> {
        const user = await this._usersRepository.findUserByUsername(username);
        if (user === undefined) throw new HttpException("User not found", 404);
        return user;
    }
}
