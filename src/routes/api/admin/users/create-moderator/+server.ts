import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { ErrorCode, type APITypes } from '$lib/api/types';
import UserManager from '$lib/server/managers/user-manager';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';

async function validateRequest(request: Request): Promise<APITypes.Admin.Users.CreateModerator.Request | null> {
	let body: APITypes.Admin.Users.CreateModerator.Request;
	try {
		body = await request.json();
	} catch {
		return null;
	}

	if (!body.username || typeof body.username !== 'string') {
		return null;
	}

	if (!body.password || typeof body.password !== 'string') {
		return null;
	}

	return body;
}

export async function POST({ request, locals }: RequestEvent) {
	const body = await validateRequest(request);
	if (!body) {
		return ConstructResponseWithCode(400);
	}

	try {
		const result = await UserManager.CreateModeratorUser(body.username, body.password);

		if (!result.success) {
			if (result.error === 'username_taken') {
				return ConstructApiErrorJSON(ErrorCode.Auth.USERNAME_TAKEN, 409);
			}
			return ConstructResponseWithCode(400);
		}

		return ConstructResponseWithCode(200);
	} catch (error) {
		console.error('Error creating moderator:', error);
		return ConstructResponseWithCode(500);
	}
}
