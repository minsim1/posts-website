import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { ErrorCode, type APITypes } from '$lib/api/types';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { configManager } from '$lib/server/managers/config-manager';
import { AddJWTCookie } from '$lib/server/helpers/repsonse';
import { CheckPasswordValidity, CheckUsernameValidity } from '$lib/helpers/validation';
import UserManager from '$lib/server/managers/user-manager';

function getChangeUsernameParamsFromRequest(request: Request): Promise<APITypes.User.ChangeUsername.Request | null> {
	return new Promise<APITypes.User.ChangeUsername.Request | null>(async (resolve) => {
		let body: any;
		try{
			body = await request.json();
		}catch{
			return resolve(null);
		}
		
		if(!body.newUsername){
			return resolve(null);
		}

		if(typeof body.newUsername !== 'string') {
			return resolve(null);
		}

		if(!body.password){
			return resolve(null);
		}

		if(typeof body.password !== 'string') {
			return resolve(null);
		}

		return resolve({
			newUsername: body.newUsername,
			password: body.password
		});
	})
}

export async function POST({ request, cookies, locals }: RequestEvent) {
	const changeUsernameParams = await getChangeUsernameParamsFromRequest(request);
	if(!changeUsernameParams) {
		return ConstructResponseWithCode(400);
	}

	if(!locals.jwt){
		return ConstructResponseWithCode(401);
	}

	const config = await configManager.GetConfig().catch();
	if(!config) {
		return ConstructResponseWithCode(500);
	}

	const usernameValidity = CheckUsernameValidity(
		changeUsernameParams.newUsername,
		config.disallowedUsernamePatterns
	);

	if(!usernameValidity.valid) {
		if(usernameValidity.error == "disallowed_pattern"){
			if(locals.jwt.role != "admin"){
				return ConstructApiErrorJSON(ErrorCode.Auth.USERNAME_INVALID, 400);
			}
		}else{
			return ConstructApiErrorJSON(ErrorCode.Auth.USERNAME_INVALID, 400);
		}
	}

	try{
		const changeUsernameResult = await UserManager.ChangeUsername(
			locals.jwt.userId,
			changeUsernameParams.newUsername,
			changeUsernameParams.password
		)
	
		if(changeUsernameResult.success == false){
			if(changeUsernameResult.error == "user_can_not_change_username"){
				return ConstructApiErrorJSON(ErrorCode.User.NOT_ALLOWED_TO_CHANGE_USERNAME, 403);
			}
	
			if(changeUsernameResult.error == "username_taken"){
				return ConstructApiErrorJSON(ErrorCode.Auth.USERNAME_TAKEN, 409);
			}
	
			if(changeUsernameResult.error == "user_does_not_exist"){
				return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
			}

			if(changeUsernameResult.error == "username_change_too_soon"){
				return ConstructApiErrorJSON(ErrorCode.User.USERNAME_CHANGE_TOO_SOON, 403);
			}

			if(changeUsernameResult.error == "incorrect_credentials"){
				return ConstructApiErrorJSON(ErrorCode.Auth.INVALID_CREDENTIALS, 401);
			}

			if(changeUsernameResult.error == "unknown_error"){
				return ConstructResponseWithCode(500);
			}
	
			return ConstructResponseWithCode(500);
		}else{
			return ConstructResponseWithCode(200);
		}
	}catch(e){
		return ConstructResponseWithCode(500);
	}
};