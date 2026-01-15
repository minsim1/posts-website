import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { ErrorCode, type APITypes } from '$lib/api/types';
import UserManager from '$lib/server/managers/user-manager';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { IsValidMongoDBObjectId } from '$lib/server/helpers/sanitization';

function validateRequest(body: any): body is APITypes.Admin.Users.SuspendUser.Request {
    if(typeof body !== 'object') return false;
    if(typeof body.duration === 'undefined') return false;
    if(body.duration !== null){
        if(typeof body.duration !== 'number') return false;
        if(!Number.isInteger(body.duration)) return false;
    }

    if(body.reason){
        if(typeof body.reason !== 'string') return false;
        if(body.reason.trim().length === 0) return false;
    }

    return true;
}

export async function POST({ params, request, locals }: RequestEvent) {
	const userId = params.userId;
	if (!userId || !IsValidMongoDBObjectId(userId)) {
		return ConstructResponseWithCode(400);
	}

    const adminUserId = locals.jwt?.userId;
    if(!adminUserId){
        return ConstructResponseWithCode(401);
    }

	try {
		const body = await request.json();

		if (!validateRequest(body)) {
			return ConstructResponseWithCode(400);
		}

		const result = await UserManager.AdminSuspendUser(
			userId,
			body.duration,
			adminUserId,
			body.reason?.trim(),
		);

		if (!result.success) {
			if (result.error === "user_not_found") {
				return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
			}
			return ConstructResponseWithCode(500);
		}

		return ConstructResponseWithCode(200);
	} catch (error) {
		console.error('Error suspending user:', error);
		return ConstructResponseWithCode(500);
	}
}
