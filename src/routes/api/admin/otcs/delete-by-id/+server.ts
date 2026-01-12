import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import type { APITypes } from '$lib/api/types';
import OTCManager from '$lib/server/managers/otc-manager';

async function validateRequest(request: Request): Promise<APITypes.Admin.OTC.DeleteById.Request | null> {
	let body: APITypes.Admin.OTC.DeleteById.Request;
	try {
		body = await request.json();
	} catch {
		return null;
	}

	if (!body.otcId || typeof body.otcId !== 'string') {
		return null;
	}

	return body;
}

export async function DELETE({ request, locals }: RequestEvent) {
	const body = await validateRequest(request);
	if (!body) {
		return ConstructResponseWithCode(400);
	}

	try {
		const deleted = await OTCManager.DeleteOTCById(body.otcId);

		if (!deleted) {
			return ConstructResponseWithCode(404);
		}

		return ConstructResponseWithCode(200);
	} catch (error) {
		return ConstructResponseWithCode(500);
	}
}
