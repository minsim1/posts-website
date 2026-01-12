import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import OTCManager from '$lib/server/managers/otc-manager';

export async function DELETE({ locals }: RequestEvent) {
	try {
		await OTCManager.DeleteAllOTCs();

		return ConstructResponseWithCode(200);
	} catch (error) {
		return ConstructResponseWithCode(500);
	}
}
