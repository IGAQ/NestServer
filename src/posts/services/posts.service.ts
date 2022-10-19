import { Inject, Injectable } from "@nestjs/common";
import { PostCreationPayloadDto } from "../models/postCreationPayload.dto";
import { User } from "../../users/models";
import { Post } from "../models";
import { IPostsService } from "./posts.service.interface";
import { _$ } from "../../_domain/injectableTokens";
import { DatabaseContext } from "../../database-access-layer/databaseContext";

@Injectable()
export class PostsService implements IPostsService {
    private readonly _dbContext: DatabaseContext;

    constructor(@Inject(_$.IDatabaseContext) databaseContext: DatabaseContext) {
        this._dbContext = databaseContext;
    }

    public async authorNewPost(postPayload: PostCreationPayloadDto, user: User): Promise<Post> {
        // validate the post payload


        // automoderation

        // if moderation failed, throw error
        // rise an event that makes a ticket in the moderation queue

        // if moderation passed, create post and return it.
        throw new Error("Not implemented");
    }
}
