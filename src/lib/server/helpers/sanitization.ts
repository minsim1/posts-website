import type { SanitizedComment, SanitizedConfig, SanitizedPost } from "$lib/api/types";
import mongoose from "mongoose";
import type { IComment } from "../db/models/comment";
import type { IConfig } from "../db/models/config";
import type { IPost } from "../db/models/post";
import type { JWT } from "./auth";

interface userVoteInfo{
    postId: string;
    voteType: "upvote" | "downvote";
}

export function GetPostSanitizationFunctionForUser(userJwt?: JWT, relevantUserVotes?: userVoteInfo[]): (post: IPost) => SanitizedPost{
    return (post: IPost) => {
        return {
            postId: post._id.toString(),
            authorName: post.anonymous ? "Anonymous" : post.authorUsername,
            authorRole: post.authorRole,
            commentsCount: post.commentsCount,
            content: post.content,
            createdAt: post.timestamp,
            score: post.upvotesCount - post.downvotesCount,
            belongsToCurrentUser: userJwt && post.authorUserId ? userJwt.userId === post.authorUserId.toString() : false,
            personalUserVote: relevantUserVotes ? (() => {
                const vote = relevantUserVotes.find(voteInfo => voteInfo.postId === post._id.toString());
                return vote ? vote.voteType : undefined;
            })() : undefined,
        }
    }
}

export function GetCommentSanitizationFunctionForUser(userJwt?: JWT): (comment: IComment) => SanitizedComment{
    return (comment: IComment) => {
        return {
            commentId: comment._id.toString(),
            postId: comment.postId.toString(),
            authorName: comment.anonymous ? "Anonymous" : comment.authorUsername,
            authorRole: comment.authorRole,
            belongsToCurrentUser: userJwt && comment.authorUserId ? userJwt.userId === comment.authorUserId.toString() : false,
            content: comment.content,
            createdAt: comment.createdAt,
        }
    }
}

export function SanitizeConfig(config: IConfig): SanitizedConfig {
    return {
        userInteractionLimits: config.userInteractionLimits.map(limit => ({
            timeframe: limit.timeframe,
            maxInteractions: limit.maxInteractions,
            interactionTypes: limit.interactionTypes,
        })),
        postingRules: config.postingRules,
        disallowedUsernamePatterns: config.disallowedUsernamePatterns,
        limits:{
            maxPostLength: config.limits.maxPostLength,
            maxCommentLength: config.limits.maxCommentLength,
            maxPostAgeToAllowDelete: config.limits.maxPostAgeToAllowDelete,
            maxCommentAgeToAllowDelete: config.limits.maxCommentAgeToAllowDelete,
            maxPostAgeToComment: config.limits.maxPostAgeToComment,
            minWaitToChangeUsername: config.limits.minWaitToChangeUsername,
        }
    }   
}

export function IsValidMongoDBObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
}