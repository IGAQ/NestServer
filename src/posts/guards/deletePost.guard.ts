import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { DeletePostPayloadDto } from "../models";
import { DatabaseContext } from "../../database-access-layer/databaseContext";
import { _$ } from "../../_domain/injectableTokens";

@Injectable()
export class DeletePostGuard implements CanActivate {
    private readonly _dbContext: DatabaseContext;

    constructor(@Inject(_$.IDatabaseContext) dbContext: DatabaseContext) {
        this._dbContext = dbContext;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const payload = new DeletePostPayloadDto(request.body);
        if (!user || !payload.postId) {
            return false;
        }

        const post = await this._dbContext.Posts.findPostById(payload.postId);
        if (!post) {
            return false;
        }
        await post.getAuthorUser();

        return post.authorUser.userId === user.id;
    }
}
