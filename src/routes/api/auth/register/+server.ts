import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { ErrorCode, type APITypes } from '$lib/api/types';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { configManager } from '$lib/server/managers/config-manager';
import { AddJWTCookie } from '$lib/server/helpers/repsonse';
import { CheckPasswordValidity, CheckUsernameValidity } from '$lib/helpers/validation';
import UserManager from '$lib/server/managers/user-manager';
import { SessionManager } from '$lib/server/managers/session-manager';
import { CONFIG } from '../../../../public-config';
import { AddRefreshTokenCookie } from '$lib/server/helpers/repsonse';

function getRegisterParamsFromRequest(request: Request): Promise<APITypes.Auth.Register.Request | null> {
	return new Promise<APITypes.Auth.Register.Request | null>(async (resolve) => {
		let body: any;
		try{
			body = await request.json();
		}catch{
			return resolve(null);
		}
		
		if(!body.username || !body.password) {
			return resolve(null);
		}

		if(typeof body.username !== 'string' || typeof body.password !== 'string') {
			return resolve(null);
		}

		if(!body.registrationOTC || typeof body.registrationOTC !== 'string'){
			return resolve(null);
		}

		return resolve({
			username: body.username,
			password: body.password,
			registrationOTC: body.registrationOTC
		});
	})
}

export async function POST({ request, cookies }: RequestEvent) {
	const registerParams = await getRegisterParamsFromRequest(request);
	if(!registerParams) {
		return ConstructResponseWithCode(400);
	}

	const config = await configManager.GetConfig().catch();
	if(!config) {
		return ConstructResponseWithCode(500);
	}

	const usernameValidity = CheckUsernameValidity(
		registerParams.username,
		config.disallowedUsernamePatterns
	);

	if(!usernameValidity.valid) {
		return ConstructApiErrorJSON(ErrorCode.Auth.USERNAME_INVALID, 400);
	}

	const passwordValidity = CheckPasswordValidity(
		registerParams.password,
	);

	if(!passwordValidity.valid) {
		return ConstructApiErrorJSON(ErrorCode.Auth.PASSWORD_INVALID, 400);
	}

	try{
		const userCreationResult = await UserManager.CreateRegularUser(
			registerParams.username,
			registerParams.password,
			registerParams.registrationOTC
		)
	
		if(userCreationResult.success == false){
			if(userCreationResult.error == "otc_invalid"){
				return ConstructApiErrorJSON(ErrorCode.Auth.OTC_INVALID, 401);
			}
	
			if(userCreationResult.error == "username_taken"){
				return ConstructApiErrorJSON(ErrorCode.Auth.USERNAME_TAKEN, 409);
			}
	
			if(userCreationResult.error == "validation_error"){
				return ConstructResponseWithCode(500);
			}
	
			return ConstructResponseWithCode(500);
		}

		const createdUserId = userCreationResult.user._id.toString();

		const session = await SessionManager.IssueSessionForUser(createdUserId);
		if(!session){
			return ConstructResponseWithCode(500);
		}

		// Set Refresh Token Cookie
		AddRefreshTokenCookie(cookies, session, CONFIG.sessions.maxInstanceLifetime);

		const jwtExpiresAtTimestamp = Date.now() + config.limits.maxJwtAge;
	
		AddJWTCookie(cookies, {
			userId: userCreationResult.user._id.toString(),
			username: userCreationResult.user.username,
			role: userCreationResult.user.role,
			iat: Math.floor(Date.now() / 1000),
		}, config.limits.maxJwtAge);
	
		const response: APITypes.Auth.Register.Response = {
			user: {
				id: userCreationResult.user._id.toString(),
				username: userCreationResult.user.username,
				role: userCreationResult.user.role
			},
			jwtExpiresAtTimestamp: jwtExpiresAtTimestamp
		}
	
		return json(response);
	}catch(e){
		return ConstructResponseWithCode(500);
	}
};