import {
    Body,
    CacheInterceptor,
    CacheTTL,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthedUser } from "../../auth/decorators/authedUser.param.decorator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Role, User } from "../../users/models";
import { _$ } from "../../_domain/injectableTokens";
import { ModerationPayloadDto } from "../dtos";
import { IModeratorActionsService } from "../services/moderatorActions/moderatorActions.service.interface";

@ApiTags("moderation")
@Controller("moderation")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ModerationController {
    private readonly _moderationActionsService: IModeratorActionsService;

    constructor(
        @Inject(_$.IModeratorActionsService) moderationActionsService: IModeratorActionsService
    ) {
        this._moderationActionsService = moderationActionsService;
    }

    @Patch("/post/:postId/allow")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async allowPost(@Param("postId", ParseUUIDPipe) postId: UUID): Promise<void> {
        await this._moderationActionsService.allowPost(postId);
    }

    @Patch("/post/restrict")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async restrictPost(
        @AuthedUser() user: User,
        @Body() moderationPayload: ModerationPayloadDto
    ): Promise<void> {
        moderationPayload.moderatorId = user.userId;
        await this._moderationActionsService.restrictPost(moderationPayload);
    }

    @Patch("/post/:postId/unrestrict")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async unrestrictPost(@Param("postId", ParseUUIDPipe) postId: UUID): Promise<void> {
        await this._moderationActionsService.unrestrictPost(postId);
    }

    @Patch("/comment/:commentId/allow")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async allowComment(@Param("commentId", ParseUUIDPipe) commentId: UUID): Promise<void> {
        await this._moderationActionsService.allowComment(commentId);
    }

    @Patch("/comment/restrict")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async restrictComment(
        @AuthedUser() user: User,
        @Body() moderationPayload: ModerationPayloadDto
    ): Promise<void> {
        moderationPayload.moderatorId = user.userId;
        await this._moderationActionsService.restrictComment(moderationPayload);
    }

    @Patch("/comment/:commentId/unrestrict")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async unrestrictComment(
        @Param("commentId", ParseUUIDPipe) commentId: UUID
    ): Promise<void> {
        await this._moderationActionsService.unrestrictComment(commentId);
    }

    @Patch("/post/delete")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async deletePost(
        @AuthedUser() user: User,
        @Body() moderationPayload: ModerationPayloadDto
    ): Promise<void> {
        moderationPayload.moderatorId = user.userId;
        await this._moderationActionsService.deletePost(moderationPayload);
    }

    @Patch("/post/:postId/restore")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async restorePost(@Param("postId", ParseUUIDPipe) postId: UUID): Promise<void> {
        await this._moderationActionsService.restorePost(postId);
    }

    @Patch("/comment/delete")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async deleteComment(
        @AuthedUser() user: User,
        @Body() moderationPayload: ModerationPayloadDto
    ): Promise<void> {
        moderationPayload.moderatorId = user.userId;
        await this._moderationActionsService.deleteComment(moderationPayload);
    }

    @Patch("/comment/:commentId/restore")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async restoreComment(@Param("commentId", ParseUUIDPipe) commentId: UUID): Promise<void> {
        await this._moderationActionsService.restoreComment(commentId);
    }

    @Patch("/user/:userId/unban")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async unbanUser(@Param("userId", ParseUUIDPipe) userId: UUID): Promise<void> {
        await this._moderationActionsService.unbanUser(userId);
    }

    @Patch("/user/ban")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async banUser(
        @AuthedUser() user: User,
        @Body() moderationPayload: ModerationPayloadDto
    ): Promise<void> {
        moderationPayload.moderatorId = user.userId;
        await this._moderationActionsService.banUser(moderationPayload);
    }

    @Get("/pendingPosts")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async getPendingPosts() {
        const posts = await this._moderationActionsService.getPendingPosts();
        const decoratedPosts = posts.map(post => post.toJSON());
        return await Promise.all(decoratedPosts);
    }

    @Get("/deletedPosts")
    @Roles(Role.MODERATOR)
    @UseGuards(AuthGuard("jwt"), RolesGuard)
    public async getDeletedPosts() {
        const posts = await this._moderationActionsService.getDeletedPosts();
        const decoratedPosts = posts.map(post => post.toJSON());
        return await Promise.all(decoratedPosts);
    }
}
