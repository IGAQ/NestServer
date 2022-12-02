import { Injectable, Scope } from "@nestjs/common";
import { INotificationMessageMakerService } from "./notificationMessageMaker.service.interface";
import { EventTypes } from "../../../_domain/eventTypes";

@Injectable({ scope: Scope.DEFAULT })
export class NotificationMessageMakerService implements INotificationMessageMakerService {
    public readonly templates = {
        [EventTypes.NewCommentOnPost]: (p: {
            username: string;
            commentId: UUID;
            postId: UUID;
            postTypeName: string;
            commentContent: string;
        }) =>
            `${p.username} replied to your ${p.postTypeName} '(uuid:${this.stashToken}:post:${
                p.postId
            }:comm:${p.commentId}:text:${p.commentContent?.slice(0, 20) ?? ""})'`,
        [EventTypes.NewCommentOnComment]: (p: {
            postId: UUID;
            commentId: UUID;
            username: string;
            commentContent: string;
        }) =>
            `${p.username} replied to your comment '(uuid:${this.stashToken}:post:${
                p.postId
            }:comm:${p.commentId}:text:${p.commentContent?.slice(0, 20) ?? ""})'`,
        [EventTypes.CommentGotUpVote]: (p: { username: string; postId: UUID; commentId: UUID }) =>
            `someone up voted your comment (uuid:${this.stashToken}:comm:${p.commentId}:post:${p.postId}:text:check it out!)`,
        [EventTypes.CommentGotDownVote]: (p: { username: string; postId: UUID; commentId: UUID }) =>
            `someone down voted your comment (uuid:${this.stashToken}:comm:${p.commentId}:post:${p.postId}:text:go to comment)`,
        [EventTypes.CommentGotRestricted]: (p: { commentContent: string; reason: string }) =>
            `A Moderator has restricted your comment due to: "${
                p.reason
            }". Comment: '${p.commentContent.slice(0, 20)}'"`,
        [EventTypes.CommentGotApprovedByModerator]: (p: {
            commentId: UUID;
            postId: UUID;
            username: string;
        }) =>
            `Our moderator, ${p.username}, allowed your comment to be published. (uuid:${this.stashToken}:comm:${p.commentId}:post:${p.postId}:text:go to comment)`,
        [EventTypes.CommentGotPinnedByAuthor]: (p: {
            commentId: UUID;
            postId: UUID;
            commentContent: string;
            username: string;
        }) =>
            `${p.username} pinned your comment '${p.commentContent.slice(0, 20)}'. (uuid:${
                this.stashToken
            }:post:${p.postId}:comm:${p.commentId}:text:Check it out)`,
        [EventTypes.PostGotUpVote]: (p: { username: string; postId: UUID }) =>
            `${p.username} up voted your post (uuid:${this.stashToken}:post:${p.postId}:text:check it out!)`,
        [EventTypes.PostGotDownVote]: (p: { username: string; postId: UUID }) =>
            `${p.username} down voted your post (uuid:${this.stashToken}:post:${p.postId}:text:go to post)`,
        [EventTypes.PostGotRestricted]: (p: { postTitle: string; reason: string }) =>
            `A Moderator has restricted your post due to: "${
                p.reason
            }". Post Title: '${p.postTitle.slice(0, 20)}'"`,
        [EventTypes.PostGotApprovedByModerator]: (p: { username: string; postId: UUID }) =>
            `Our moderator, ${p.username}, allowed your post to be published. (uuid:${this.stashToken}:post:${p.postId}:text:go to post)`,
    };

    public stashToken: string;

    public makeForNewCommentOnPost(p: {
        postId: UUID;
        commentId: UUID;
        username: string;
        postTypeName: string;
        commentContent: string;
    }): string {
        return this.templates[EventTypes.NewCommentOnPost](p);
    }

    public makeForNewCommentOnComment(p: {
        postId: UUID;
        commentId: UUID;
        username: string;
        commentContent: string;
    }): string {
        return this.templates[EventTypes.NewCommentOnComment](p);
    }

    public makeForCommentGotUpVote(p: { username: string; postId: UUID; commentId: UUID }): string {
        return this.templates[EventTypes.CommentGotUpVote](p);
    }

    public makeForCommentGotDownVote(p: {
        username: string;
        postId: UUID;
        commentId: UUID;
    }): string {
        return this.templates[EventTypes.CommentGotDownVote](p);
    }

    public makeForCommentGotRestricted(p: { commentContent: string; reason: string }): string {
        return this.templates[EventTypes.CommentGotRestricted](p);
    }

    public makeForCommentGotApprovedByModerator(p: {
        commentId: UUID;
        postId: UUID;
        username: string;
    }): string {
        return this.templates[EventTypes.CommentGotApprovedByModerator](p);
    }

    public makeForCommentGotPinnedByAuthor(p: {
        commentId: UUID;
        postId: UUID;
        commentContent: string;
        username: string;
    }): string {
        return this.templates[EventTypes.CommentGotPinnedByAuthor](p);
    }

    public makeForPostGotUpVote(p: { username: string; postId: UUID }): string {
        return this.templates[EventTypes.PostGotUpVote](p);
    }

    public makeForPostGotDownVote(p: { username: string; postId: UUID }): string {
        return this.templates[EventTypes.PostGotDownVote](p);
    }

    public makeForPostGotRestricted(p: { postTitle: string; reason: string }): string {
        return this.templates[EventTypes.PostGotRestricted](p);
    }

    public makeForPostGotApprovedByModerator(p: { username: string; postId: UUID }): string {
        return this.templates[EventTypes.PostGotApprovedByModerator](p);
    }
}
