import type { Config, UserInteractionLimit, UserInteractionType, UserRole } from "$lib/server/db/types";

export interface ErrorResponse {
	error:{
		code: AllErrorCodes;
		message: string;
	}
}

export namespace ErrorCode {
    export enum Auth {
        INVALID_CREDENTIALS = 1000,
        USERNAME_TAKEN = 1001,
        USERNAME_INVALID = 1002,
        USERNAME_UNAVAILABLE = 1003,
		OTC_INVALID = 1004,
		PASSWORD_INVALID = 1005,
    }

    export enum User {
        USER_NOT_FOUND = 2000,
		NOT_ALLOWED_TO_CHANGE_USERNAME = 2001,
		SUSPENDED = 2004,
		USERNAME_CHANGE_TOO_SOON = 2005,
    }

	export enum Posts {
		POST_NOT_FOUND = 3000,
		CONTENT_INVALID = 3001,
		QUERY_DATE_RANGE_TOO_LARGE = 3002,
		NON_OWNER_CAN_NOT_DELETE = 3003,
		POST_TOO_OLD_TO_DELETE = 3004,
		POSTING_VIOLATES_LIMIT_RULES = 3005,
		POST_TOO_LONG = 3006,
	}

	export enum Moderation {
		UNAUTHORIZED_SUSPENSION = 4000,
		UNAUTHORIZED_DELETION = 4001,
		AUTHOR_ID_EXPUNGED = 4002,
	}

	export enum Votes{
		VOTING_VIOLATES_LIMIT_RULES = 5000,
	}

	export enum Comments {
		COMMENT_NOT_FOUND = 6000,
		CONTENT_INVALID = 6001,
		NON_OWNER_CAN_NOT_DELETE = 6003,
		COMMENT_TOO_OLD_TO_DELETE = 6004,
		COMMENTING_VIOLATES_LIMIT_RULES = 6005,
		COMMENT_TOO_LONG = 6006,
		POST_TOO_OLD_TO_COMMENT_ON = 6007,
	}
}

export type AllErrorCodes = 
	| ErrorCode.Auth
	| ErrorCode.User
	| ErrorCode.Posts
	| ErrorCode.Moderation
	| ErrorCode.Votes
	| ErrorCode.Comments;

export interface SanitizedPost{
	postId: string;
	authorName: string;
	authorRole: UserRole | "anonymous";
	content: string;
	createdAt: number;
	commentsCount: number;
	score: number;
	belongsToCurrentUser?: boolean;
	personalUserVote?: "upvote" | "downvote";
}

export interface SanitizedConfig{
	userInteractionLimits: {
		timeframe: number;
		maxInteractions: number;
		interactionTypes: UserInteractionType[];
	}[];
    postingRules: string[];
    disallowedUsernamePatterns: string[];
    limits:{
        maxPostLength: number;
        maxCommentLength: number;
        maxPostAgeToAllowDelete: number;
        maxCommentAgeToAllowDelete: number;
        maxPostAgeToComment: number;
		minWaitToChangeUsername: number;
    }
}

export interface SanitizedComment{
	commentId: string;
	postId: string;
	authorName: string;
	authorRole: UserRole | "anonymous";
	content: string;
	createdAt: number;
	belongsToCurrentUser?: boolean;
}

export interface SanitizedUser{
	id: string;
	username: string;
	role: UserRole;
	suspension : {
		reason: string;
		suspendedUntilTimestamp: number | null;
	} | null;
	canChangeUsername: boolean;
	lastUsernameChangeTimestamp: number;
	latestInteractions: {
		interactionType: UserInteractionType;
		timestamp: number;
	}[]
}

export interface SanitizedOTC{
	code: string;
	expiresAtTimestamp: number;
}

interface Suspension{
	reason: string;
	suspendedUntilTimestamp: number | null;
	timestamp: number;
	suspendorUserId: string;
}

export namespace AdminAPITypes {
	export interface User{
		id: string;
		username: string;
		role: UserRole;
		suspension : Suspension | null;
		canChangeUsername: boolean;
		suspensionHistory: Suspension[];
		suspensionLiftHistory: {
			timestamp: number;
			liftorUserId: string;
			reason: string;
		}[];
		moderationLogs: {
			timestamp: number;
			action: "suspend_user" | "lift_suspension" | "delete_post" | "delete_comment";
			targetUserId: string | null;
			reason: string | null;
			content: string | null;
			suspensionDuration: number | null;
			suspensionApplied: boolean;
			attemptedToApplySuspension: boolean;
		}[];
		otcs: SanitizedOTC[];
	}

	export interface UserListItem{
		id: string;
		username: string;
		role: UserRole;
	}

	export interface UserStateChangeRequest{
		newUsername: string;
		newPassword: string;
		setCanChangeUsername: boolean;
	}

	export interface RecordsQueryRes{
		numOfModLogsToBeDeleted: number;
		numOfAnonPostsWithNonExpungedAuthorIDs: number;
		numOfAnonCommentsWithNonExpungedAuthorIDs: number;
	}

	export interface RecordsDeletionRes{
		numOfUsersAffectedByModLogDeletion: number;
		numOfExpungedAuthorIdsInAnonPosts: number;
		numOfExpungedAuthorIdsInAnonComments: number;
	}
}

export namespace APITypes {
	export namespace Auth {
		export namespace Login {
			export interface Request {
				username: string;
				password: string;
			}

			export type Response = {
				type: "success"
				user: {
					id: string;
					username: string;
					role: 'admin' | 'user' | 'moderator';
				},
				jwtExpiresAtTimestamp: number;
			} | {
				type: "suspended"
				suspensionReason: string;
				suspendedUntilTimestamp: number | null;
			}
		}

		export namespace Register {
			export interface Request {
				username: string;
				password: string;
				registrationOTC: string;
			}

			export type Response = {
				user: {
					id: string;
					username: string;
					role: 'admin' | 'user' | 'moderator';
				};
				jwtExpiresAtTimestamp: number;
			}
		}

		export namespace Refresh {
			export type Response = {
				jwtExpiresAtTimestamp: number;
			}
		}
	}

	export namespace User {
		export namespace GetData {
			export interface Response {
				user: SanitizedUser;
			}
		}

		export namespace ChangePassword {
			export interface Request {
				currentPassword: string;
				newPassword: string;
			}
		}

		export namespace ChangeUsername {
			export interface Request {
				newUsername: string;
				password: string;
			}
		}

		export namespace GetOTCs {
			export interface Response {
				otcs: SanitizedOTC[];
			}
		}
	}

	export namespace ServerConfig {
		export interface Response {
			config: SanitizedConfig;
		}
	}

	export namespace Posts {
		export namespace Query{
			// Send date in url parameters like date=YYYY-MM-DD

			export interface Response {
				posts: SanitizedPost[];
			}
		}

		export namespace Get{
			export interface Response {
				post: SanitizedPost;
			}
		}

		export namespace Create{
			export interface Request {
				content: string;
				anonymous: boolean;
			}

			export interface Response {
				postId: string;
			}
		}

		export namespace Delete{
			// The post id to delete will be in the url path
			export interface Request {
				suspension?:{
					reason: string;
					duration: number | null; // null means permanent suspension
				}
			}

			export interface Response{
				suspensionStatus?: "applied" | "not_applied_new_is_shorter";
			}
		}

		export namespace Vote{
			export interface Request {
				postId: string;
				voteType: "upvote" | "downvote" | "remove_vote";
			}

			export interface Response {
				newVote: "upvote" | "downvote" | null;
				newScore: number;
			}
		}

		export namespace Comment{
			export namespace Get{
				export interface Response {
					comments: SanitizedComment[];
				}
			}

			export namespace Create{
				export interface Request {
					content: string
					anonymous: boolean;
				}
			}

			export namespace Delete{
				export interface Request {
					suspension?:{
						reason: string;
						duration: number | null; // null means permanent suspension
					}
				}

				export interface Response{
					suspensionStatus?: "applied" | "not_applied_new_is_shorter";
				}
			}

			export namespace GetById{
				export interface Response {
					comment: SanitizedComment;
				}
			}
		}
	}

	export namespace Admin {
		export namespace ModifyConfig {
			export interface Request {
				// User interaction limits
				newUserInteractionLimits?: UserInteractionLimit[],
				removeUserInteractionLimits?: string[],
				modifyUserInteractionLimits?: {
					limitId: string;
					newLimit: UserInteractionLimit;
				}[],

				// Posting rules
				newPostingRules?: string[],
				removePostingRules?: string[],

				// Posts Discord webhook URLs
				newPostsDiscordWebhookUrls?: string[],
				removePostsDiscordWebhookUrls?: string[],

				// Disallowed username patterns
				newDisallowedUsernamePatterns?: string[],
				removeDisallowedUsernamePatterns?: string[],

				// Limits
				setMaxInteractionsToSave?: number,
				setMaxInteractionAgeToSave?: number,
				setMaxPostLength?: number,
				setMaxCommentLength?: number,
				setMaxJwtAge?: number
				setMaxPostAgeToAllowDelete?: number,
				setMaxCommentAgeToAllowDelete?: number,
				setMaxPostAgeToComment?: number,
				setMinWaitToChangeUsername?: number,
				setMaxModerationLogAgeToSave?: number,
			}
		}

		export namespace GetServerConfig {
			export interface Response {
				config: Config;
			}
		}

		export namespace Records {
			export interface QueryResponse {
				queryResult: AdminAPITypes.RecordsQueryRes
			}

			export interface ExpungeResponse {
				expungeResult: AdminAPITypes.RecordsDeletionRes
			}
		}

		export namespace Instagram {
			export namespace UploadImage {
				export interface Response {
					containerId: string;
				}
			}

			export namespace CreatePost {
				export interface Request {
					containerIds: string[],
					caption?: string;
				}
			}
		}

		export namespace OTC {
			export namespace Statistics {
				export interface Response {
					count: number;
				}
			}

			export namespace IssueToUser {
				export interface Request {
					userId: string;
					count: number;
					durationMs: number;
				}
			}

			export namespace IssueToRoles {
				export interface Request {
					roles: UserRole[];
					count: number;
					durationMs: number;
				}
			}

			export namespace DeleteById {
				export interface Request {
					otcId: string;
				}
			}

			export namespace DeleteAllUserOTCs {
				export interface Request {
					userId: string;
				}
			}
		}

		export namespace Users {
			export namespace GetById {
				// Pass id in url path

				export interface Response {
					user: AdminAPITypes.User;
				}
			}

			export namespace CreateModerator {
				export interface Request {
					username: string;
					password: string;
				}
			}

			export namespace ChangeUsername{
				export interface Request {
					newUsername: string;
				}
			}

			export namespace ChangePassword{
				export interface Request {
					newPassword: string;
				}
			}

			export namespace VerifyPassword{
				export interface Request {
					password: string;
				}

				export interface Response {
					isCorrect: boolean;
				}
			}

			export namespace SetCanChangeUsername{
				export interface Request {
					canChangeUsername: boolean;
				}
			}

			export namespace Query {
				// can set 'role' as url param to filter by role
				export interface Response {
					users: AdminAPITypes.UserListItem[];
				}
			}

			export namespace SuspendUser {
				export interface Request {
					reason?: string;
					duration: number | null; // null = permanent, otherwise milliseconds
				}
			}

			export namespace LiftSuspension {
				export interface Request {
					reason?: string;
				}
			}
		}
	}

	export namespace Moderation {
		export namespace LatestContent {
			export interface Response {
				posts: SanitizedPost[];
				comments: SanitizedComment[];
			}
		}

		export namespace AuthorLastSuspension {
			// Pass type and id in url path

			export interface Response {
				suspension: {
					reason: string;
					suspendedUntilTimestamp: number | null;
					timestamp: number;
				} | null;
			}
		}
	}
}