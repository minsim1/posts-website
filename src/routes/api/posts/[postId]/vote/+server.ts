import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { GetPostSanitizationFunctionForUser, IsValidMongoDBObjectId } from '$lib/server/helpers/sanitization';
import { ErrorCode, type APITypes, type SanitizedPost } from '$lib/api/types';
import { configManager } from '$lib/server/managers/config-manager';
import { CheckPostContentValidity } from '$lib/helpers/validation';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import PostManager from '$lib/server/managers/post-manager';
import VoteManager from '$lib/server/managers/vote-manager';

function getValidInputFromRequest(request: Request): Promise<APITypes.Posts.Vote.Request | null>{
	return new Promise<APITypes.Posts.Vote.Request | null>(async (resolve) => {
		let body: any;
		try{
			body = await request.json();
		}catch{
			return resolve(null);
		}
		
		if(!body.postId || !body.voteType){
			return resolve(null);
		}

		if(typeof body.postId !== 'string' || typeof body.voteType !== 'string' || !IsValidMongoDBObjectId(body.postId)){
			return resolve(null);
		}

		if(body.voteType !== "upvote" && body.voteType !== "downvote" && body.voteType !== "remove_vote"){
			return resolve(null);
		}

		return resolve({
			postId: body.postId,
			voteType: body.voteType
		});
	})
}

// Set vote
export async function POST({ cookies, url, locals, request }: RequestEvent) {
	const params = await getValidInputFromRequest(request);
	if(!params){
		return ConstructResponseWithCode(400);
	}

	const jtw = locals.jwt;
	if(!jtw){
		return ConstructResponseWithCode(401);
	}

	try{
		const responseData = await VoteManager.SetUserVote(
			jtw.userId,
			params.postId,
			params.voteType
		);

		if(responseData.success == false){
			if(responseData.error == "post_not_found"){
				return ConstructApiErrorJSON(ErrorCode.Posts.POST_NOT_FOUND, 404);
			}

			if(responseData.error == "user_not_found"){
				return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
			}

			if(responseData.error == "action_violates_limit_rules"){
				return ConstructApiErrorJSON(ErrorCode.Votes.VOTING_VIOLATES_LIMIT_RULES, 429);
			}

			if(responseData.error == "user_suspended"){
				return ConstructApiErrorJSON(ErrorCode.User.SUSPENDED, 403);
			}

			if(responseData.error == "unknown_error"){
				return ConstructResponseWithCode(500);	
			}
			
			return ConstructResponseWithCode(500);
		}else{
			const result: APITypes.Posts.Vote.Response = {
				newVote: responseData.newVoteType,
				newScore: responseData.newScore
			}

			return json(result);
		}
	}catch(error){
		return ConstructResponseWithCode(500);
	}
};