import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import type { APITypes } from '$lib/api/types';
import OTCManager from '$lib/server/managers/otc-manager';
import type { UserRole } from '$lib/server/db/types';

async function validateRequest(request: Request): Promise<APITypes.Admin.OTC.IssueToRoles.Request | null> {
	let body: APITypes.Admin.OTC.IssueToRoles.Request;
	try {
		body = await request.json();
	} catch {
		return null;
	}

	if (!Array.isArray(body.roles) || body.roles.length === 0) {
		return null;
	}

	// Validate all roles are valid
	const validRoles: UserRole[] = ['admin', 'moderator', 'user'];
	for (const role of body.roles) {
		if (!validRoles.includes(role)) {
			return null;
		}
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
	const body = await validateRequest(request);
	if (!body) {
		return ConstructResponseWithCode(400);
	}

	try {
		await OTCManager.CreateOTCForRoles(body.roles, body.durationMs, body.count);

		return ConstructResponseWithCode(200);
	} catch (error) {
		return ConstructResponseWithCode(500);
	}
}
