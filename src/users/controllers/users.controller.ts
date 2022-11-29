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
    Put,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { _$ } from "../../_domain/injectableTokens";
import { Role, User } from "../models";
import { ModerationPayloadDto } from "../../moderation/dtos/moderatorActions";
import { AuthedUser } from "../../auth/decorators/authedUser.param.decorator";
import { OptionalJwtAuthGuard } from "../../auth/guards/optionalJwtAuth.guard";
import { PublicUserDto, SetupProfileDto } from "../dtos";
import { IProfileSetupService } from "../services/profileSetup/profileSetup.service.interface";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { IUserHistoryService } from "../services/userHistory/userHistory.service.interface";
import { IModeratorActionsService } from "src/moderation/services/moderatorActions/moderatorActions.service.interface";

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
    private readonly _dbContext: DatabaseContext;
    private readonly _userHistoryService: IUserHistoryService;
    private readonly _profileSetup: IProfileSetupService;
    private readonly _moderationActions: IModeratorActionsService;

    constructor(
        @Inject(_$.IDatabaseContext) dbContext: DatabaseContext,
        @Inject(_$.IUserHistoryService) userHistoryService: IUserHistoryService,
        @Inject(_$.IProfileSetupService) profileSetupService: IProfileSetupService,
        @Inject(_$.IModeratorActionsService) moderatorActionsService: IModeratorActionsService
    ) {
        this._dbContext = dbContext;
        this._userHistoryService = userHistoryService;
        this._profileSetup = profileSetupService;
        this._moderationActions = moderatorActionsService;
    }

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async index(): Promise<User[]> {
        const users = await this._dbContext.Users.findAll();
        const decoratedUsers = users.map(user => user.toJSON());
        return await Promise.all(decoratedUsers);
    }

    @Get(":userId")
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async getUserById(@Param("userId", new ParseUUIDPipe()) userId: string): Promise<User> {
        const user = await this._dbContext.Users.findUserById(userId);
        if (user === undefined) throw new HttpException("User not found", 404);
        return user;
    }

    @Get("/username/:username")
    @UseGuards(OptionalJwtAuthGuard)
    public async getUserByUsername(
        @Param("username") username: string,
        @AuthedUser() authedUser?: User
    ): Promise<PublicUserDto | User> {
        const user = await this._dbContext.Users.findUserByUsername(username);
        if (user === undefined) throw new HttpException("User not found", 404);

        // if the found user is the same as the authed user, return the full user object
        if (authedUser?.userId === user.userId) {
            return await user.toJSON();
        }
        return PublicUserDto.fromUser(await user.toJSON());
    }

    @Get("/:username/history/posts")
    @UseGuards(OptionalJwtAuthGuard)
    public async getPostHistoryOfUserByUsername(
        @Param("username") username: string,
        @AuthedUser() authedUser?: User
    ) {
        const posts = await this._userHistoryService.getPostsHistoryByUsername(username);
        const decoratedPosts = posts.map(post =>
            post.toJSON({ authenticatedUserId: authedUser?.userId ?? undefined })
        );
        return await Promise.all(decoratedPosts);
    }

    @Put("/profileSetup")
    @UseGuards(AuthGuard("jwt"))
    public async profileSetupSubmit(@Body() setupProfileDto: SetupProfileDto): Promise<void> {
        await this._profileSetup.setupProfile(setupProfileDto);
    }

    @Patch("/ban")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async banUser(
        @AuthedUser() authedUser: User,
        @Body() moderationPayloadDto: ModerationPayloadDto
    ): Promise<void> {
        moderationPayloadDto.moderatorId = authedUser.userId;
        await this._moderationActions.banUser(moderationPayloadDto);
    }

    @Patch("/unban/:userId")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async unbanUser(
        @AuthedUser() authedUser: User,
        @Param("userId") userId: string
    ): Promise<void> {
        await this._moderationActions.unbanUser(userId);
    }
}
