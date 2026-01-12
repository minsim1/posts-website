import { ErrorCode, type AllErrorCodes } from "$lib/api/types";

export const EN_errorStrings: Record<AllErrorCodes, string> = {
    [ErrorCode.Auth.INVALID_CREDENTIALS]: "Invalid username or password.",
    [ErrorCode.Auth.USERNAME_TAKEN]: "Username is already taken.",
    [ErrorCode.Auth.USERNAME_INVALID]: "Username is invalid.",
    [ErrorCode.Auth.USERNAME_UNAVAILABLE]: "Username is unavailable.",
    [ErrorCode.Auth.OTC_INVALID]: "One-time code is invalid.",
    [ErrorCode.Auth.PASSWORD_INVALID]: "Password does not meet the required criteria.",

    [ErrorCode.User.USER_NOT_FOUND]: "User not found.",
    [ErrorCode.User.NOT_ALLOWED_TO_CHANGE_USERNAME]: "You are not allowed to change your username.",
    [ErrorCode.User.SUSPENDED]: "User account is suspended.",
    [ErrorCode.User.USERNAME_CHANGE_TOO_SOON]: "You cannot change your username so soon after the last change.",

    [ErrorCode.Posts.POST_NOT_FOUND]: "Post not found.",
    [ErrorCode.Posts.CONTENT_INVALID]: "Content is invalid.",
    [ErrorCode.Posts.QUERY_DATE_RANGE_TOO_LARGE]: "The date range for the query is too large.",
    [ErrorCode.Posts.NON_OWNER_CAN_NOT_DELETE]: "You are not the owner of this post and cannot delete it.",
    [ErrorCode.Posts.POST_TOO_OLD_TO_DELETE]: "This post is too old to be deleted.",
    [ErrorCode.Posts.POSTING_VIOLATES_LIMIT_RULES]: "Posting violates the set limit rules.",
    [ErrorCode.Posts.POST_TOO_LONG]: "The post exceeds the maximum allowed length.",

    [ErrorCode.Comments.COMMENT_NOT_FOUND]: "Comment not found.",
    [ErrorCode.Comments.CONTENT_INVALID]: "Content is invalid.",
    [ErrorCode.Comments.NON_OWNER_CAN_NOT_DELETE]: "You are not the owner of this comment and cannot delete it.",
    [ErrorCode.Comments.COMMENT_TOO_OLD_TO_DELETE]: "This comment is too old to be deleted.",
    [ErrorCode.Comments.COMMENTING_VIOLATES_LIMIT_RULES]: "Commenting violates the set limit rules.",
    [ErrorCode.Comments.COMMENT_TOO_LONG]: "The comment exceeds the maximum allowed length.",
    [ErrorCode.Comments.POST_TOO_OLD_TO_COMMENT_ON]: "This post is too old to comment on.",

    [ErrorCode.Votes.VOTING_VIOLATES_LIMIT_RULES]: "Voting violates the set limit rules.",

    [ErrorCode.Moderation.UNAUTHORIZED_DELETION]: "You are not authorized to delete this content.",
    [ErrorCode.Moderation.UNAUTHORIZED_SUSPENSION]: "You are not authorized to suspend this user.",
    [ErrorCode.Moderation.AUTHOR_ID_EXPUNGED]: "The author's user ID has been expunged from the content you are trying to moderate.",
}