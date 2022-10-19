import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    ParseUUIDPipe
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Post } from "../models";
import { IPostsRepository } from "../services/postRepository/posts.repository.inerface";

@Controller("posts")
export class PostsController {
    constructor(@Inject("IPostsRepository") private _postsService: IPostsRepository) { }

    @Get()
    public async index(): Promise<Post[] | Error> {
        return (await this._postsService.findAll()).map(p => new Post(p));
    }

    @Get(":postId")
    public async getPostById(
        @Param("postId", new ParseUUIDPipe()) postId: string
    ): Promise<Post | Error> {
        const post = await this._postsService.findPostById(postId);
        if (post === undefined) throw new HttpException("Post not found", 404);
        return new Post(post);
    }


}

// Find all Posts

// Create a Post

// Find a Post by ID
