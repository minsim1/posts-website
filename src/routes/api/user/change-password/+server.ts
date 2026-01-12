import { ErrorCode, type APITypes } from '$lib/api/types';
import { CheckPasswordValidity } from '$lib/helpers/validation';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import UserManager from '$lib/server/managers/user-manager';
import { json, type RequestEvent } from '@sveltejs/kit';

async function getValidParamsFromRequest(req: Request): Promise<APITypes.User.ChangePassword.Request | null>{
	const data = await req.json().catch(() => null) as APITypes.User.ChangePassword.Request | null;
	if(!data) return null;

	if(data.currentPassword === undefined || data.newPassword === undefined) return null;
	if(typeof data.currentPassword !== 'string' || typeof data.newPassword !== 'string') return null;
	
	return data;
}

export async function POST({ cookies, request, locals }: RequestEvent) {
	try{
		const params = await getValidParamsFromRequest(request);
		if(!params) return ConstructResponseWithCode(400);

		const jwt = locals.jwt;
		if(!jwt) return ConstructResponseWithCode(401);

		const isPasswordValid = CheckPasswordValidity(params.newPassword);
		if(isPasswordValid.valid == false){
			return ConstructResponseWithCode(400);
		}

		const result = await UserManager.ChangeUserPassword(
			jwt.userId,
			params.currentPassword,
			params.newPassword
		)

		if(result.success == false){
			if(result.error == "user_does_not_exist"){
				return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404)
			}

			if(result.error == "incorrect_credentials"){
				return ConstructApiErrorJSON(ErrorCode.Auth.INVALID_CREDENTIALS, 403)
			}

			if(result.error == "unknown_error"){
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
