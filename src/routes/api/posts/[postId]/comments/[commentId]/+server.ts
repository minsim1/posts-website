import { json, type RequestEvent } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db/database';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { ErrorCode, type APITypes } from '$lib/api/types';
import CommentManager from '$lib/server/managers/comment-manager';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import { GetCommentSanitizationFunctionForUser, IsValidMongoDBObjectId } from '$lib/server/helpers/sanitization';

// Get specific comment for post
export async function GET({ cookies, params }: RequestEvent) {
	const postId = params.postId;
	if(!postId || !IsValidMongoDBObjectId(postId)){
		return ConstructResponseWithCode(400);
	}

	const commentId = params.commentId;
	if(!commentId || !IsValidMongoDBObjectId(commentId)){
		return ConstructResponseWithCode(400);
	}

	try{
		const comment = await CommentManager.GetCommentById(commentId);
		if(!comment){
			return ConstructApiErrorJSON(ErrorCode.Comments.COMMENT_NOT_FOUND, 404);
		}

		const response: APITypes.Posts.Comment.GetById.Response = {
			comment: GetCommentSanitizationFunctionForUser(undefined)(comment)
		}

		return json(response);
	}catch(err){
		return ConstructResponseWithCode(500);
	}
};

async function getDeleteCommentParamsFromRequest(request: Request): Promise<APITypes.Posts.Comment.Delete.Request | null> {
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

// Delete specific comment for post
export async function DELETE({ cookies, params, locals, request }: RequestEvent) {
	const postId = params.postId;
	if(!postId || !IsValidMongoDBObjectId(postId)){
		return ConstructResponseWithCode(400);
	}

	const commentId = params.commentId;
	if(!commentId || !IsValidMongoDBObjectId(commentId)){
		return ConstructResponseWithCode(400);
	}

	if(!locals.jwt){
		return ConstructResponseWithCode(401);
	}

	const commentDeleteParams = await getDeleteCommentParamsFromRequest(request).catch(() => null);
	if(!commentDeleteParams){
		return ConstructResponseWithCode(400);
	}

	if(locals.jwt.role !== 'admin' && locals.jwt.role !== 'moderator'){
		commentDeleteParams.suspension = undefined;
	}

	try{
		const result = await CommentManager.DeleteComment(
			commentId,
			postId,
			locals.jwt.userId,
			commentDeleteParams.suspension
		)

		if(result.success == false){
			if(result.error == "comment_not_found"){
				return ConstructApiErrorJSON(ErrorCode.Comments.COMMENT_NOT_FOUND, 404);
			}

			if(result.error == "post_not_found"){
				return ConstructApiErrorJSON(ErrorCode.Posts.POST_NOT_FOUND, 404);
			}

			if(result.error == "user_not_found"){
				return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
			}

			if(result.error == "not_owner"){
				return ConstructApiErrorJSON(ErrorCode.Comments.NON_OWNER_CAN_NOT_DELETE, 403);
			}

			if(result.error == "comment_too_old_to_delete"){
				return ConstructApiErrorJSON(ErrorCode.Comments.COMMENT_TOO_OLD_TO_DELETE, 403);
			}

			if(result.error == "unauthorized_suspension"){
				return ConstructApiErrorJSON(ErrorCode.Moderation.UNAUTHORIZED_SUSPENSION, 403);
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
		}else{
			const response: APITypes.Posts.Comment.Delete.Response = {};

			if(result.suspensionApplied){
				response.suspensionStatus = result.suspensionApplied == "applied" ? "applied" : "not_applied_new_is_shorter";
			}
			
			return json(response);
		}
	}catch(error){
		return ConstructResponseWithCode(500);
	}
};