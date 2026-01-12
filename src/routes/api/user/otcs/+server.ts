import type { APITypes } from '$lib/api/types';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import OTCManager from '$lib/server/managers/otc-manager';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function GET({ locals }: RequestEvent) {
	const userId = locals.jwt?.userId;
	if (!userId) return ConstructResponseWithCode(401);

	try {
		const otcs = await OTCManager.GetUserOTCs(userId);

		const responseData: APITypes.User.GetOTCs.Response = {
			otcs: otcs.map(otc => ({
				code: otc.code,
				expiresAtTimestamp: otc.expiresAtTimestamp.getTime()
			}))
		};

		return json(responseData);
	} catch (err) {
		console.error('Error fetching user OTCs:', err);
		return ConstructResponseWithCode(500);
	}
}
