import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { ErrorCode, type APITypes, type AdminAPITypes } from '$lib/api/types';
import UserManager from '$lib/server/managers/user-manager';
import OTCManager from '$lib/server/managers/otc-manager';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { IsValidMongoDBObjectId } from '$lib/server/helpers/sanitization';

export async function GET({ params, locals }: RequestEvent) {
	const userId = params.userId;
	if (!userId || !IsValidMongoDBObjectId(userId)) {
		return ConstructResponseWithCode(400);
	}

	try {
		const user = await UserManager.GetUserById(userId);
		if (!user) {
			return ConstructResponseWithCode(404);
		}

		const otcs = await OTCManager.GetUserOTCs(userId);

		// Sort arrays by timestamp (newest first)
		const sortedSuspensionHistory = [...user.suspensionHistory].sort((a, b) => b.timestamp - a.timestamp);
		const sortedSuspensionLiftHistory = [...user.suspensionLiftHistory].sort((a, b) => b.timestamp - a.timestamp);
		const sortedModerationLogs = [...user.moderationLogs].sort((a, b) => b.timestamp - a.timestamp);

		const responseData: APITypes.Admin.Users.GetById.Response = {
			user: {
				id: user._id.toString(),
				username: user.username,
				role: user.role,
				suspension: user.suspension,
				canChangeUsername: user.canChangeUsername,
				suspensionHistory: sortedSuspensionHistory,
				suspensionLiftHistory: sortedSuspensionLiftHistory,
				moderationLogs: sortedModerationLogs,
				otcs: otcs.map(otc => ({
					code: otc.code,
					expiresAtTimestamp: otc.expiresAtTimestamp.getTime()
				}))
			}
		};

		return json(responseData);
	} catch (error) {
		console.error('Error fetching user by ID:', error);
		return ConstructResponseWithCode(500);
	}
}

export async function DELETE({ params, locals }: RequestEvent) {
	const userId = params.userId;
	if (!userId || !IsValidMongoDBObjectId(userId)) {
		return ConstructResponseWithCode(400);
	}

	try {
		const deleted = await UserManager.DeleteUserById(userId);

		if (!deleted) {
			return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
		}

		return ConstructResponseWithCode(200);
	} catch (error) {
		console.error('Error deleting user:', error);
		return ConstructResponseWithCode(500);
	}
}
