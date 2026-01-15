import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { ErrorCode, type APITypes } from '$lib/api/types';
import UserManager from '$lib/server/managers/user-manager';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { IsValidMongoDBObjectId } from '$lib/server/helpers/sanitization';

async function validateRequest(request: Request): Promise<APITypes.Admin.Users.ChangeUsername.Request | null> {
	let body: APITypes.Admin.Users.ChangeUsername.Request;
	try {
		body = await request.json();
	} catch {
		return null;
	}

	if (!body.newUsername || typeof body.newUsername !== 'string') {
		return null;
	}

	return body;
}

export async function POST({ params, request, locals }: RequestEvent) {
	const userId = params.userId;
	if (!userId || !IsValidMongoDBObjectId(userId)) {
		return ConstructResponseWithCode(400);
	}

	const body = await validateRequest(request);
	if (!body) {
		return ConstructResponseWithCode(400);
	}

	try {
		const result = await UserManager.AdminChangeUsername(userId, body.newUsername);

		if (!result.success) {
			if (result.error === 'user_not_found') {
				return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
			}
			if (result.error === 'username_taken') {
				return ConstructApiErrorJSON(ErrorCode.Auth.USERNAME_TAKEN, 409);
			}

			return ConstructResponseWithCode(500);
		}

		return ConstructResponseWithCode(200);
	} catch (error) {
		console.error('Error changing username:', error);
		return ConstructResponseWithCode(500);
	}
}
