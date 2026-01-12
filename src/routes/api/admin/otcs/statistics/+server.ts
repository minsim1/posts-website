import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import type { APITypes } from '$lib/api/types';
import OTCManager from '$lib/server/managers/otc-manager';

export async function GET({ locals }: RequestEvent) {
	try {
		const count = await OTCManager.GetTotalOTCCount();

		const response: APITypes.Admin.OTC.Statistics.Response = {
			count: count
		};

		return json(response);
	} catch (error) {
		return ConstructResponseWithCode(500);
	}
}
