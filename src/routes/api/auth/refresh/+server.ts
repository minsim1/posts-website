import { AddJWTCookie, AddRefreshTokenCookie, ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { configManager } from '$lib/server/managers/config-manager';
import { SessionManager } from '$lib/server/managers/session-manager';
import UserManager from '$lib/server/managers/user-manager';
import { json, type RequestEvent } from '@sveltejs/kit';
import { CONFIG } from '../../../../public-config';
import type { APITypes } from '$lib/api/types';

export async function POST({ cookies, locals }: RequestEvent) {
	if(!locals.refreshToken){
		return ConstructResponseWithCode(400);
	}

	try{
		const config = await configManager.GetConfig();
		const refreshedSession = await SessionManager.RefreshSession(locals.refreshToken);

		const userData = await UserManager.GetUserById(refreshedSession.userId);
		if(!userData){
			return ConstructResponseWithCode(401);
		}

		const jwtExpiresIn = config.limits.maxJwtAge;

		AddJWTCookie(cookies,{
			userId: refreshedSession.userId,
			role: userData.role,
			iat: Math.floor(Date.now() / 1000),
			username: userData.username
		}, jwtExpiresIn)

		AddRefreshTokenCookie(cookies, refreshedSession.newSessionId, CONFIG.sessions.maxInstanceLifetime);

		const response: APITypes.Auth.Refresh.Response = {
			jwtExpiresAtTimestamp: Date.now() + jwtExpiresIn
		}

		return json(response);
	}catch(error){
		// Session does not exist or there was some failure
		return ConstructResponseWithCode(401);
	}
};
