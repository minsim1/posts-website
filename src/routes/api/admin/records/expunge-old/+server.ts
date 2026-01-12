import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import type { APITypes, AdminAPITypes } from '$lib/api/types';
import UserManager from '$lib/server/managers/user-manager';
import type { UserRole } from '$lib/server/db/types';
import { configManager } from '$lib/server/managers/config-manager';
import PostManager from '$lib/server/managers/post-manager';
import CommentManager from '$lib/server/managers/comment-manager';

export async function POST({ url, locals }: RequestEvent) {
	if (!locals.jwt || locals.jwt.role !== 'admin') {
		return ConstructResponseWithCode(403);
	}

	try {
		const config = await configManager.GetConfig();
		const postDeletionCutoffTimestamp = Date.now() - config.limits.maxPostAgeToAllowDelete;
		const commentDeletionCutoffTimestamp = Date.now() - config.limits.maxCommentAgeToAllowDelete;
		const modLogDeletionCutoffTimestamp = Date.now() - config.limits.maxModerationLogAgeToSave;

		const postCount = await PostManager.DeleteAnonPostsWithPresentAuthorIdBeforeTimestamp(
			postDeletionCutoffTimestamp
		)

		const commentCount = await CommentManager.DeleteAnonCommentsWithPresentAuthorIdBeforeTimestamp(
			commentDeletionCutoffTimestamp
		)

		const numOfAffectedUsers = await UserManager.DeleteModLogsOlderThan(
			modLogDeletionCutoffTimestamp
		)

		const response: APITypes.Admin.Records.ExpungeResponse = {
			expungeResult: {
				numOfUsersAffectedByModLogDeletion: numOfAffectedUsers,
				numOfExpungedAuthorIdsInAnonComments: commentCount,
				numOfExpungedAuthorIdsInAnonPosts: postCount
			}
		}

		return json(response);
	} catch (error) {
		console.error('Error querying users:', error);
		return ConstructResponseWithCode(500);
	}
}
