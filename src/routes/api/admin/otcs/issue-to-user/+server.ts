import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { ErrorCode, type APITypes } from '$lib/api/types';
import OTCManager from '$lib/server/managers/otc-manager';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { IsValidMongoDBObjectId } from '$lib/server/helpers/sanitization';

async function validateRequest(request: Request): Promise<APITypes.Admin.OTC.IssueToUser.Request | null> {
	let body: APITypes.Admin.OTC.IssueToUser.Request;
	try {
		body = await request.json();
	} catch {
		return null;
	}

	if (!body.userId || typeof body.userId !== 'string' || !IsValidMongoDBObjectId(body.userId)) {
		return null;
	}

	if (typeof body.count !== 'number' || body.count < 1 || !Number.isInteger(body.count)) {
		return null;
	}

    if(typeof body.durationMs !== 'number' || body.durationMs < 1 || !Number.isInteger(body.durationMs)){
        return null;
    }

	return body;
}

export async function POST({ request, locals }: RequestEvent) {
	if (!locals.jwt || locals.jwt.role !== 'admin') {
		return ConstructResponseWithCode(403);
	}

	const body = await validateRequest(request);
	if (!body) {
		return ConstructResponseWithCode(400);
	}

	try {
		const res = await OTCManager.CreateOTC(body.userId, body.durationMs, body.count);
        if(!res.success){
            if(res.error == "user_not_found"){
                return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
            }

            return ConstructResponseWithCode(500);
        }

		return ConstructResponseWithCode(200);
	} catch (error) {
		return ConstructResponseWithCode(500);
	}
}
