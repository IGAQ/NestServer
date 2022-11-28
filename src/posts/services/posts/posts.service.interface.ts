import { Comment } from "../../../comments/models";
import { PostCreationPayloadDto, VotePostPayloadDto } from "../../dtos";
import { Post } from "../../models";

export type postSortCallback = (postA: Post, postB: Post) => number;

export interface IPostsService {
    authorNewPost(postPayload: PostCreationPayloadDto): Promise<Post>;

    getQueeryOfTheDay(): Promise<Post>;

    findAllQueeries(): Promise<Post[]>;

    findAllStories(): Promise<Post[]>;

    findPostById(postId: UUID): Promise<Post>;

    findNestedCommentsByPostId(
        postId: UUID,
        topLevelLimit: number,
        nestedLimit: number,
        nestedLevel: number
    ): Promise<Comment[]>;

    getNestedComments(comments: Comment[], nestedLevel: number, nestedLimit: number): Promise<void>;

    votePost(votePostPayload: VotePostPayloadDto): Promise<void>;
}
