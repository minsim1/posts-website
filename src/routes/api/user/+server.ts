import type { APITypes } from '$lib/api/types';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import UserManager from '$lib/server/managers/user-manager';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function GET({ cookies, locals }: RequestEvent) {
	const id = locals.jwt?.userId;
	if(!id) return ConstructResponseWithCode(401);

	try{
		const user = await UserManager.GetUserById(id);
		if(!user) return ConstructResponseWithCode(404);

		const responseData: APITypes.User.GetData.Response = {
			user:{
				id: user._id.toString(),
				username: user.username,
				role: user.role,
				suspension: user.suspension,
				canChangeUsername: user.canChangeUsername,
				lastUsernameChangeTimestamp: user.lastUsernameChangeTimestamp,
				latestInteractions: user.latestInteractions.map(interaction => ({
					interactionType: interaction.interactionType,
					timestamp: interaction.timestamp
				}))
			}
		};

		return json(responseData);
	}catch(err){
		return ConstructResponseWithCode(500);
	}
};
