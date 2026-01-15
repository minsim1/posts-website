import { json, type RequestEvent } from '@sveltejs/kit';
import { ErrorCode, type SanitizedPost } from '$lib/api/types';
import { GetPostSanitizationFunctionForUser, IsValidMongoDBObjectId } from '$lib/server/helpers/sanitization';
import type { APITypes } from '$lib/api/types';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import VoteManager from '$lib/server/managers/vote-manager';
import PostManager from '$lib/server/managers/post-manager';

// Get specific post
export async function GET({ cookies, url, locals, params }: RequestEvent) {
	const postId = params.postId;
	if(!postId || !IsValidMongoDBObjectId(postId)){
		return ConstructResponseWithCode(400);
	}

	try{
		const post = await PostManager.GetPostById(postId);

		if(!post){
			return ConstructApiErrorJSON(ErrorCode.Posts.POST_NOT_FOUND, 404);
		}

		let sanitizedPost: SanitizedPost;
		
		if(locals.jwt){
			const relevantVotes = await VoteManager.GetUserVotesForPosts(locals.jwt.userId, [post._id.toString()])
			sanitizedPost = GetPostSanitizationFunctionForUser(locals.jwt, relevantVotes)(post);
		}else{
			sanitizedPost = GetPostSanitizationFunctionForUser()(post);
		}

		const responseData: APITypes.Posts.Get.Response = {
			post: sanitizedPost
		}

		return json(responseData);
	}catch(error){
		return ConstructResponseWithCode(500);
	}
};

async function getDeletePostParamsFromRequest(request: Request): Promise<APITypes.Posts.Delete.Request | null> {
	const body: any = await request.json().catch(() => null);	
	if(body === null) return null;
	
	if(body.suspension !== undefined){
		if(typeof body.suspension !== 'object' || body.suspension === null){
			return null;
		}

		if(typeof body.suspension.reason !== 'string'){
			return null;
		}
		
		if(body.suspension.duration === undefined) return null;
		
		if(body.suspension.duration !== null){
			if(typeof body.suspension.duration !== 'number' || !Number.isInteger(body.suspension.duration)){
				return null;
			}
			if(body.suspension.duration < 0){
				return null;
			}
		}
	}

	return {
		suspension: body.suspension ? {
			reason: body.suspension.reason,
			duration: body.suspension.duration
		} : undefined
	}
}

// Delete specific post
export async function DELETE({ cookies, locals, request, params }: RequestEvent) {
	const postId = params.postId;
	if(!postId || !IsValidMongoDBObjectId(postId)){
		return ConstructResponseWithCode(400);
	}

	if(!locals.jwt){
		return ConstructResponseWithCode(401);
	}

	const postDeleteParams = await getDeletePostParamsFromRequest(request).catch(() => null);
	if(!postDeleteParams){
		return ConstructResponseWithCode(400);
	}

	if(locals.jwt.role !== 'admin' && locals.jwt.role !== 'moderator'){
		postDeleteParams.suspension = undefined;
	}

	try{
		const result = await PostManager.DeletePost(
			postId,
			locals.jwt.userId,
			locals.jwt.role,
			postDeleteParams.suspension == undefined ? undefined : {
				reason: postDeleteParams.suspension.reason,
				duration: postDeleteParams.suspension.duration
			}
		)

		if(result.success == false){
			if(result.error == "post_not_found"){
				return ConstructApiErrorJSON(ErrorCode.Posts.POST_NOT_FOUND, 404);
			}

			if(result.error == "user_not_found"){
				return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
			}

			if(result.error == "unauthorized_suspension"){
				return ConstructApiErrorJSON(ErrorCode.Moderation.UNAUTHORIZED_SUSPENSION, 403);
			}

			if(result.error == "not_owner"){
				return ConstructApiErrorJSON(ErrorCode.Posts.NON_OWNER_CAN_NOT_DELETE, 403);
			}

			if(result.error == "too_old_to_delete"){
				return ConstructApiErrorJSON(ErrorCode.Posts.POST_TOO_OLD_TO_DELETE, 403);
			}

			if(result.error == "deletor_suspended"){
				return ConstructApiErrorJSON(ErrorCode.User.SUSPENDED, 403);
			}

			if(result.error == "unauthorized_deletion"){
				return ConstructApiErrorJSON(ErrorCode.Moderation.UNAUTHORIZED_DELETION, 403);
			}

			if(result.error == "unknown_error"){
				return ConstructResponseWithCode(500);
			}

			return ConstructResponseWithCode(500);
		}else if(result.success == true){
			const response: APITypes.Posts.Delete.Response = {};

			if(result.suspensionApplied){
				response.suspensionStatus = result.suspensionApplied == "applied" ? "applied" : "not_applied_new_is_shorter";
			}

			return json(response);
		}
	}catch(error){
		return ConstructResponseWithCode(500);
	}
};