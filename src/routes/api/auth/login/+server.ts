import { json, type RequestEvent } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db/database';
import { ErrorCode, type APITypes } from '$lib/api/types';
import { AddJWTCookie, AddRefreshTokenCookie, ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import UserManager from '$lib/server/managers/user-manager';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { configManager } from '$lib/server/managers/config-manager';
import { SessionManager } from '$lib/server/managers/session-manager';
import { CONFIG } from '../../../../public-config';

async function GetLoginParamsFromRequest(request: Request): Promise<APITypes.Auth.Login.Request | null> {
	let body: any;
	try{
		body = await request.json();
	}catch{
		return null;
	}

	if(!body.username || !body.password) {
		return null;
	}

	if(typeof body.username !== 'string' || typeof body.password !== 'string') {
		return null;
	}

	return {
		username: body.username,
		password: body.password
	};
} 

export async function POST({ request, cookies }: RequestEvent) {
	let loginParams = await GetLoginParamsFromRequest(request);
	if(!loginParams) {
		return ConstructResponseWithCode(400);
	}

	const { username, password } = loginParams;

	try{
		const user = await UserManager.GetUserByCredentials(username, password);
		const config = await configManager.GetConfig();

		if(!user){
			return ConstructApiErrorJSON(ErrorCode.Auth.INVALID_CREDENTIALS, 401);
		}

		const isSuspendedRes = await UserManager.IsUserSuspended(user._id.toString(), user);

		if(isSuspendedRes.suspended == true){
			const response: APITypes.Auth.Login.Response = {
				type: "suspended",
				suspensionReason: isSuspendedRes.suspensionReason,
				suspendedUntilTimestamp: isSuspendedRes.suspendedUntilTimestamp
			}
	
			return json(response);
		}

		const session = await SessionManager.IssueSessionForUser(user._id.toString());
		if(!session){
			return ConstructResponseWithCode(500);
		}

		// Set Refresh Token Cookie
		AddRefreshTokenCookie(cookies, session, CONFIG.sessions.maxInstanceLifetime);

		const jwtExpiresAtTimestamp = Date.now() + config.limits.maxJwtAge;

		// Add JWT Cookie
		AddJWTCookie(cookies, {
			userId: user._id.toString(),
			username: user.username,
			role: user.role,
			iat: Math.floor(Date.now() / 1000),
		}, config.limits.maxJwtAge);

		const response: APITypes.Auth.Login.Response = {
			type: "success",
			user: {
				id: user._id.toString(),
				username: user.username,
				role: user.role
			},
			jwtExpiresAtTimestamp: jwtExpiresAtTimestamp
		};

		return json(response);
	}catch(error){
		console.error("Error during login:", error);
		return ConstructResponseWithCode(500);
	}
};
