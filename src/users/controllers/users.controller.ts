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
import { IUsersRepository } from "../services/usersRepository/users.repository.interface";
import { AuthGuard } from "@nestjs/passport";
import { _$ } from "../../_domain/injectableTokens";

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
    constructor(@Inject(_$.IUsersRepository) private _usersRepository: IUsersRepository) {}

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async index(): Promise<User[] | Error> {
        return await this._usersRepository.findAll();
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
