import { PostCreationPayloadDto, VotePostPayloadDto } from "../../dtos";
import { Post } from "../../models";
import { Comment } from "../../../comments/models";

export type postSortCallback = (postA: Post, postB: Post) => number;

export interface IPostsService {
    authorNewPost(postPayload: PostCreationPayloadDto): Promise<Post>;

    getQueeryOfTheDay(): Promise<Post>;

    findAllQueeries(sorted: null | postSortCallback): Promise<Post[]>;

    findAllStories(sorted: null | postSortCallback): Promise<Post[]>;

    findPostById(postId: string): Promise<Post>;

    findNestedCommentsByPostId(
        postId: string,
        limit: number,
        nestedLimit: number,
        nestedLevel: number
    ): Promise<Comment[]>;

    markAsDeleted(postId: string): Promise<void>;

    votePost(votePostPayload: VotePostPayloadDto): Promise<void>;
}
