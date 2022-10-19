import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe,
    UseInterceptors,
} from "@nestjs/common";
import { Post } from "../models";
import { IPostsRepository } from "../services/postRepository/posts.repository.inerface";
import { _$ } from "../../_domain/injectableTokens";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("posts")
@Controller("posts")
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
    constructor(@Inject(_$.IPostsRepository) private _postsRepository: IPostsRepository) {}

    @Get()
    public async index(): Promise<Post[] | Error> {
        let posts = await this._postsRepository.findAll();
        for (let i = 0; i < posts.length; i++) {
            posts[i] = await posts[i].toJSON();
        }
        return posts;
    }

    @Get(":postId")
    public async getPostById(
        @Param("postId", new ParseUUIDPipe()) postId: string
    ): Promise<Post | Error> {
        const post = await this._postsRepository.findPostById(postId);
        if (post === undefined) throw new HttpException("Post not found", 404);
        return await post.toJSON();
    }
}

// Find all Posts

// Create a Post

// Find a Post by ID
