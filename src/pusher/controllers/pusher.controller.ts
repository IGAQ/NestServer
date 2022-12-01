import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
    ClassSerializerInterceptor,
    Controller,
    Inject,
    Post,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { _$ } from "../../_domain/injectableTokens";
import { IPusherService } from "../services/pusher/pusher.service.interface";
import { AuthGuard } from "@nestjs/passport";
import { AuthedUser } from "../../auth/decorators/authedUser.param.decorator";
import { User } from "../../users/models";
import { IPusherUserPoolService } from "../services/pusherUserPoolServer/pusherUserPool.service.interface";

@ApiTags("pusher")
@Controller("pusher")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class PusherController {
    private readonly _pusherService: IPusherService;
    private readonly _pusherUserPoolService: IPusherUserPoolService;

    constructor(
        @Inject(_$.IPusherService) pusherService: IPusherService,
        @Inject(_$.IPusherUserPoolService) pusherUserPoolService: IPusherUserPoolService
    ) {
        this._pusherService = pusherService;
        this._pusherUserPoolService = pusherUserPoolService;
    }

    @Post("/auth")
    @UseGuards(AuthGuard("jwt"))
    public async authenticate(@AuthedUser() authedUser: User): Promise<string> {
        return await this._pusherUserPoolService.addUserToPool(authedUser.userId); // returns poolId
    }
}
