import { Post } from "../../../posts/models";
import { IUserHistoryService } from "./userHistory.service.interface";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { HttpException, Inject } from "@nestjs/common";
import { _$ } from "../../../_domain/injectableTokens";
import { Comment } from "../../../comments/models";

export class UserHistoryService implements IUserHistoryService {
    private readonly _dbContext: DatabaseContext;

    constructor(@Inject(_$.IDatabaseContext) dbContext: DatabaseContext) {
        this._dbContext = dbContext;
    }

    public async getPostsHistoryByUsername(username: string): Promise<Post[]> {
        const user = await this._dbContext.Users.findUserByUsername(username);
        if (!user) throw new HttpException("User does not exist.", 404);

        return await this._dbContext.Posts.getPostHistoryByUserId(user.userId);
    }

    public async getCommentsHistoryByUsername(username: string): Promise<Comment[]> {
        throw new Error("Not implemented");
    }

    public async getTotalLikesByUsername(username: string): Promise<number> {
        throw new Error("Not implemented");
    }
}
