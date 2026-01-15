import { json, type RequestEvent } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db/database';
import type { APITypes } from '$lib/api/types';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { configManager } from '$lib/server/managers/config-manager';
import type { UserInteractionLimit } from '$lib/server/db/types';
import { CONFIG } from '../../../../public-config';

function isStringArray(arr: any): arr is string[] {
	if(!Array.isArray(arr)) return false;

	for(const item of arr){
		if(typeof item !== 'string'){
			return false;
		}
	}

	return true;
}

function isNumberArray(arr: any): arr is number[] {
	if(!Array.isArray(arr)) return false;

	for(const item of arr){
		if(typeof item !== 'number'){
			return false;
		}
	}

	return true;
}

function isPositiveInteger(value: any): value is number {
	if(typeof value !== 'number') return false;
	if(value < 0) return false;
	if(!Number.isInteger(value)) return false;
	return true;
}

async function getValidatedConfigDataFromRequest(req: Request) : Promise<APITypes.Admin.ModifyConfig.Request | null>{
	const body = await req.json() as APITypes.Admin.ModifyConfig.Request;

	if(!body) return null;
	if(body.newUserInteractionLimits !== undefined){
		if(!Array.isArray(body.newUserInteractionLimits)) return null;

		for(const limit of body.newUserInteractionLimits){
			if(!Array.isArray(limit.interactionTypes)){
				return null;
			}

			if(!isPositiveInteger(limit.timeframe)) return null;
			if(!isPositiveInteger(limit.maxInteractions)) return null;

			for(const interactionType of limit.interactionTypes){
				if(typeof interactionType !== 'string'){
					return null;
				}
			}
		}
	}

	if(body.removeUserInteractionLimits !== undefined){
		if(!isStringArray(body.removeUserInteractionLimits)) return null;
	}

	if(body.modifyUserInteractionLimits !== undefined){
		if(!Array.isArray(body.modifyUserInteractionLimits)) return null;
		
		for(const limit of body.modifyUserInteractionLimits){
			if(typeof limit.limitId !== 'string'){
				return null;
			}

			const newUserInteraction = limit.newLimit;
			if(!isPositiveInteger(newUserInteraction.timeframe) || !isPositiveInteger(newUserInteraction.maxInteractions) || !Array.isArray(newUserInteraction.interactionTypes)){
				return null;
			}

			for(const interactionType of newUserInteraction.interactionTypes){
				if(typeof interactionType !== 'string'){
					return null;
				}
			}
		}
	}

	if(body.newPostingRules !== undefined){
		if(!isStringArray(body.newPostingRules)) return null;
	}

	if(body.removePostingRules !== undefined){
		if(!isStringArray(body.removePostingRules)) return null;
	}

	if(body.newPostsDiscordWebhookUrls !== undefined){
		if(!isStringArray(body.newPostsDiscordWebhookUrls)) return null;
	}

	if(body.removePostsDiscordWebhookUrls !== undefined){
		if(!isStringArray(body.removePostsDiscordWebhookUrls)) return null;
	}

	if(body.newDisallowedUsernamePatterns !== undefined){
		if(!isStringArray(body.newDisallowedUsernamePatterns)) return null;
	}

	if(body.removeDisallowedUsernamePatterns !== undefined){
		if(!isStringArray(body.removeDisallowedUsernamePatterns)) return null;
	}

	if(body.setMaxInteractionsToSave !== undefined){
		if(!isPositiveInteger(body.setMaxInteractionsToSave)) return null;
	}

	if(body.setMaxInteractionAgeToSave !== undefined){
		if(!isPositiveInteger(body.setMaxInteractionAgeToSave)) return null;
	}

	if(body.setMaxPostLength !== undefined){
		if(!isPositiveInteger(body.setMaxPostLength)) return null;
	}

	if(body.setMaxCommentLength !== undefined){
		if(!isPositiveInteger(body.setMaxCommentLength)) return null;
	}

	if(body.setMaxJwtAge !== undefined){
		if(!isPositiveInteger(body.setMaxJwtAge)) return null;
	}

	if(body.setMaxPostAgeToAllowDelete !== undefined){
		if(!isPositiveInteger(body.setMaxPostAgeToAllowDelete)) return null;
	}

	if(body.setMaxCommentAgeToAllowDelete !== undefined){
		if(!isPositiveInteger(body.setMaxCommentAgeToAllowDelete)) return null;
	}

	if(body.setMaxPostAgeToComment !== undefined){
		if(!isPositiveInteger(body.setMaxPostAgeToComment)) return null;
	}

	if(body.setMinWaitToChangeUsername !== undefined){
		if(!isPositiveInteger(body.setMinWaitToChangeUsername)) return null;
	}

	if(body.setMaxModerationLogAgeToSave !== undefined){
		if(!isPositiveInteger(body.setMaxModerationLogAgeToSave)) return null;
	}

	return body;
}

export async function POST({ request, locals }: RequestEvent) {
	if(!locals.jwt || locals.jwt.role !== 'admin'){
		return ConstructResponseWithCode(403);
	}

	const configModifyRequest = await getValidatedConfigDataFromRequest(request);
	if(!configModifyRequest){
		return ConstructResponseWithCode(400);
	}

	// * Handle config modification logic here

	if(configModifyRequest.newUserInteractionLimits){
		// Add new user interaction limits
		for(const limit of configModifyRequest.newUserInteractionLimits){
			configManager.AddUserInteractionLimit(
				limit.timeframe,
				limit.maxInteractions,
				limit.interactionTypes
			)
		}
	}

	if(configModifyRequest.removeUserInteractionLimits){
		// Remove user interaction limits
		for(const limitId of configModifyRequest.removeUserInteractionLimits){
			configManager.RemoveUserInteractionLimit(limitId);
		}
	}

	if(configModifyRequest.modifyUserInteractionLimits){
		for(const limit of configModifyRequest.modifyUserInteractionLimits){
			configManager.UpdateUserInteractionLimit(
				limit.limitId,
				limit.newLimit.timeframe,
				limit.newLimit.maxInteractions,
				limit.newLimit.interactionTypes
			)
		}
	}

	if(configModifyRequest.newPostingRules){
		for(const rule of configModifyRequest.newPostingRules){
			configManager.AddPostingRule(rule);
		}
	}

	if(configModifyRequest.removePostingRules){
		for(const rule of configModifyRequest.removePostingRules){
			configManager.RemovePostingRule(rule);
		}
	}

	if(configModifyRequest.newPostsDiscordWebhookUrls){
		for(const url of configModifyRequest.newPostsDiscordWebhookUrls){
			configManager.AddPostsDiscordWebhookUrl(url);
		}
	}

	if(configModifyRequest.removePostsDiscordWebhookUrls){
		for(const url of configModifyRequest.removePostsDiscordWebhookUrls){
			configManager.RemovePostsDiscordWebhookUrl(url);
		}
	}

	if(configModifyRequest.newDisallowedUsernamePatterns){
		for(const pattern of configModifyRequest.newDisallowedUsernamePatterns){
			configManager.AddDisallowedUsernamePattern(pattern);
		}
	}

	if(configModifyRequest.removeDisallowedUsernamePatterns){
		for(const pattern of configModifyRequest.removeDisallowedUsernamePatterns){
			configManager.RemoveDisallowedUsernamePattern(pattern);
		}
	}

	if(configModifyRequest.setMaxInteractionsToSave !== undefined){
		configManager.SetMaxInteractionsToSave(configModifyRequest.setMaxInteractionsToSave);
	}

	if(configModifyRequest.setMaxInteractionAgeToSave !== undefined){
		configManager.SetMaxInteractionAgeToSave(configModifyRequest.setMaxInteractionAgeToSave);
	}

	if(configModifyRequest.setMaxPostLength !== undefined){
		configManager.SetMaxPostLength(configModifyRequest.setMaxPostLength);
	}

	if(configModifyRequest.setMaxCommentLength !== undefined){
		configManager.SetMaxCommentLength(configModifyRequest.setMaxCommentLength);
	}

	if(configModifyRequest.setMaxPostAgeToAllowDelete !== undefined){
		configManager.SetMaxPostAgeToAllowDelete(configModifyRequest.setMaxPostAgeToAllowDelete);
	}
	
	if(configModifyRequest.setMaxCommentAgeToAllowDelete !== undefined){
		configManager.SetMaxCommentAgeToAllowDelete(configModifyRequest.setMaxCommentAgeToAllowDelete);
	}

	if(configModifyRequest.setMaxPostAgeToComment !== undefined){
		configManager.SetMaxPostAgeToComment(configModifyRequest.setMaxPostAgeToComment);
	}

	if(configModifyRequest.setMinWaitToChangeUsername !== undefined){
		configManager.SetMinWaitToChangeUsername(configModifyRequest.setMinWaitToChangeUsername);
	}

	if(configModifyRequest.setMaxModerationLogAgeToSave !== undefined){
		configManager.SetMaxModerationLogAgeToSave(configModifyRequest.setMaxModerationLogAgeToSave);
	}

	if(configModifyRequest.setMaxJwtAge !== undefined){
		if(configModifyRequest.setMaxJwtAge < CONFIG.jwt.minConfigurableLifetime){
			return ConstructResponseWithCode(400);
		}

		if(configModifyRequest.setMaxJwtAge > CONFIG.jwt.maxConfigurableLifetime){
			return ConstructResponseWithCode(400);
		}

		configManager.SetMaxJwtAge(configModifyRequest.setMaxJwtAge);
	}

	// Respond with success
	return ConstructResponseWithCode(200);
};

export async function GET({ request, locals }: RequestEvent) {
	if(!locals.jwt || locals.jwt.role !== 'admin'){
		return ConstructResponseWithCode(403);
	}

	try{
		const config = await configManager.GetConfig(true);
		const response: APITypes.Admin.GetServerConfig.Response = {
			config: {
				disallowedUsernamePatterns: config.disallowedUsernamePatterns,
				postingRules: config.postingRules,
				postsDiscordWebhookUrls: config.postsDiscordWebhookUrls,
				userInteractionLimits: config.userInteractionLimits.map(limit => {
					const cleanedLimit: UserInteractionLimit = {
						interactionTypes: limit.interactionTypes,
						maxInteractions: limit.maxInteractions,
						timeframe: limit.timeframe,
						limitId: limit.limitId
					}
					return cleanedLimit;
				}),
				limits: config.limits
			}
		}

		return json(response);
	}catch(err){
		return ConstructResponseWithCode(500)
	}

}