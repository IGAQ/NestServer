import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe,
    Patch,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { _$ } from "../../_domain/injectableTokens";
import { Role, User } from "../models";
import { IUsersRepository } from "../repositories/users/users.repository.interface";
import { ModerationPayloadDto } from "../../moderation/dtos/moderatorActions";
import { AuthedUser } from "../../auth/decorators/authedUser.param.decorator";
import { OptionalJwtAuthGuard } from "../../auth/guards/optionalJwtAuth.guard";
import { PublicUserDto } from "../dtos";

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
    private readonly _usersRepository: IUsersRepository;

    constructor(@Inject(_$.IUsersRepository) usersRepository: IUsersRepository) {
        this._usersRepository = usersRepository;
    }

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async index(): Promise<User[]> {
        const users = await this._usersRepository.findAll();
        const decoratedUsers = users.map(user => user.toJSON());
        return await Promise.all(decoratedUsers);
    }

    @Get(":userId")
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async getUserById(@Param("userId", new ParseUUIDPipe()) userId: string): Promise<User> {
        const user = await this._usersRepository.findUserById(userId);
        if (user === undefined) throw new HttpException("User not found", 404);
        return user;
    }

    @Get("/username/:username")
    @UseGuards(OptionalJwtAuthGuard)
    public async getUserByUsername(
        @Param("username") username: string,
        @AuthedUser() authedUser?: User
    ): Promise<PublicUserDto | User> {
        const user = await this._usersRepository.findUserByUsername(username);
        if (user === undefined) throw new HttpException("User not found", 404);

        // if the found user is the same as the authed user, return the full user object
        if (authedUser?.userId === user.userId) {
            return await user.toJSON();
        }
        return PublicUserDto.fromUser(await user.toJSON());
    }

    @Patch("/ban")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async banUser(
        @AuthedUser() authedUser: User,
        @Body() moderationPayloadDto: ModerationPayloadDto
    ): Promise<User> {
        moderationPayloadDto.moderatorId = authedUser.userId;
        throw new HttpException("Not implemented", 501);
    }

    @Patch("/unban/:userId")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async unbanUser(
        @AuthedUser() authedUser: User,
        @Body() moderationPayloadDto: ModerationPayloadDto
    ): Promise<User> {
        moderationPayloadDto.moderatorId = authedUser.userId;
        throw new HttpException("Not implemented", 501);
    }
}
