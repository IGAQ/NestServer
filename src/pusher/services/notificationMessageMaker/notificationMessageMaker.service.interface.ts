import { EventTypes } from "../../../_domain/eventTypes";

export interface INotificationMessageMakerService {
    stashToken: UUID;

    templates: { [key in EventTypes]: (p: object) => string };

    makeForNewCommentOnPost(p: {
        postId: UUID;
        commentId: UUID;
        username: string;
        postTypeName: string;
        commentContent: string;
    }): string;

    makeForNewCommentOnComment(p: {
        postId: UUID;
        commentId: UUID;
        username: string;
        commentContent: string;
    }): string;

    makeForCommentGotUpVote(p: { username: string; postId: UUID; commentId: UUID }): string;

    makeForCommentGotDownVote(p: { username: string; postId: UUID; commentId: UUID }): string;

    makeForCommentGotRestricted(p: { commentContent: string; reason: string }): string;

    makeForCommentGotApprovedByModerator(p: {
        commentId: UUID;
        postId: UUID;
        username: string;
    }): string;

    makeForCommentGotPinnedByAuthor(p: {
        commentId: UUID;
        postId: UUID;
        commentContent: string;
        username: string;
    }): string;

    makeForPostGotUpVote(p: { username: string; postId: UUID }): string;

    makeForPostGotDownVote(p: { username: string; postId: UUID }): string;

    makeForPostGotRestricted(p: { postTitle: string; reason: string }): string;

    makeForPostGotApprovedByModerator(p: { username: string; postId: UUID }): string;
}
