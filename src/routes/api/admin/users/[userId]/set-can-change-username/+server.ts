import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { ErrorCode, type APITypes } from '$lib/api/types';
import UserManager from '$lib/server/managers/user-manager';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { IsValidMongoDBObjectId } from '$lib/server/helpers/sanitization';

async function validateRequest(request: Request): Promise<APITypes.Admin.Users.SetCanChangeUsername.Request | null> {
	let body: APITypes.Admin.Users.SetCanChangeUsername.Request;
	try {
		body = await request.json();
	} catch {
		return null;
	}

	if (typeof body.canChangeUsername !== 'boolean') {
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
		const updated = await UserManager.SetCanChangeUsername(userId, body.canChangeUsername);

		if (!updated) {
			return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
		}

		return ConstructResponseWithCode(200);
	} catch (error) {
		console.error('Error setting canChangeUsername:', error);
		return ConstructResponseWithCode(500);
	}
}
