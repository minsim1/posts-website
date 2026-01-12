// * These types are here mostly for refference, actual types are defined in Mongoose models

// * CONFIG

export interface UserInteractionLimit{
    limitId: string;
    timeframe: number;
    maxInteractions: number;
    interactionTypes: UserInteractionType[];
}

export interface Config{
    userInteractionLimits: UserInteractionLimit[];
    postingRules: string[];
    postsDiscordWebhookUrls: string[];
    disallowedUsernamePatterns: string[];
    limits:{
        maxInteractionAgeToSave: number;
        maxInteractionsToSave: number;
        maxPostLength: number;
        maxCommentLength: number;
        maxPostAgeToAllowDelete: number;
        maxCommentAgeToAllowDelete: number;
        maxPostAgeToComment: number;
        maxJwtAge: number;
        minWaitToChangeUsername: number;
        maxModerationLogAgeToSave: number;
    }
}

// export type LogType = 
//     "user_registration"

// export interface Log{
//     timestamp: number;
//     level: "info" | "warning" | "error";
//     message: string;
//     type: LogType;
// }

// * USERS

export type UserRole = "admin" | "moderator" | "user";

export type UserInteractionType = "comment" | "vote" | "post";

export interface UserInteraction{
    interactionType: UserInteractionType;
    timestamp: number;
}

export interface UserSuspension{
    reason: string;
    suspendedUntilTimestamp: number | null; // null means permanent suspension
    timestamp: number;
    suspendorUserId: string;
}

export interface UserSuspensionLift{
    liftedAtTimestamp: number;
    liftorUserId: string;
    reason: string;
}

export interface ModerationLog{
    timestamp: number;
    action: "suspend_user" | "lift_suspension" | "delete_post" | "delete_comment";
    targetUserId: string;
    reason: string | null;
    content: string | null;
    contentType: "post" | "comment" | null;
    suspensionDuration: number | null;
    suspensionApplied: boolean;
}

export interface User{
    id: string;
    role: UserRole;
    username: string;
    passwordHash: string;
    canChangeUsername: boolean;
    lastUsernameChangeTimestamp: string;
    latestInteractions: UserInteraction[];
    suspension: UserSuspension | null;
    suspensionHistory: UserSuspension[];
    suspensionLiftHistory: UserSuspensionLift[];
}

// * OTCS

export interface OTC{
    code: string;
    ownerUserId: string;
    expiresAtTimestamp: number;
}

// * POSTS

export interface Post{
    id: string;
    authorId: string;
    authorUsername: string;
    authorRole: UserRole | "anonymous";
    discordWebhookMessages: {
        messageId: string;
        webhookUrl: string;
    }[];
    anonymous: boolean;
    content: string;
    timestamp: number;
    commentsCount: number;
    upvotesCount: number;
    downvotesCount: number;
}

// * VOTES

export interface Vote{
    postId: string;
    userId: string;
    voteType: "upvote" | "downvote";
}

// * COMMENTS

export interface Comment{
    commentId: string;
    postId: string;
    authorUserId: string;
    authorUsername: string;
    authorRole: UserRole | "anonymous";
    anonymous: boolean;
    content: string;
    timestamp: number;
}

// * MESSAGES

// export type Message = {
//     transmissionType: "direct"
//     messageType: "info" | "important" | "critical";
//     senderId: string;
//     senderUsername: string;
//     recipientId: string;
//     recipientUsername: string;
//     timestamp: number;
//     content: string;
// } | {
//     transmissionType: "broadcast"
//     messageType: "info" | "important" | "critical";
//     senderId: string;
//     senderUsername: string;
//     receivers: UserRole[]; // roles that should receive the message
//     timestamp: number;
//     content: string;
// }