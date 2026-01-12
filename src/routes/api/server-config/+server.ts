import type { APITypes } from '$lib/api/types';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { SanitizeConfig } from '$lib/server/helpers/sanitization';
import { configManager } from '$lib/server/managers/config-manager';
import UserManager from '$lib/server/managers/user-manager';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function GET({ cookies, locals }: RequestEvent) {
	try{
		const config = await configManager.GetConfig();
		if(!config) return ConstructResponseWithCode(500);

		const responseData: APITypes.ServerConfig.Response = {
			config: SanitizeConfig(config)
		};

		return json(responseData);
	}catch(err){
		return ConstructResponseWithCode(500);
	}
};
