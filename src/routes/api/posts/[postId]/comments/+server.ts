import { json, type RequestEvent } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db/database';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import CommentManager from '$lib/server/managers/comment-manager';
import { ErrorCode, type APITypes, type SanitizedComment } from '$lib/api/types';
import { GetCommentSanitizationFunctionForUser } from '$lib/server/helpers/sanitization';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';

// Get all comments for post
export async function GET({ cookies, params, locals }: RequestEvent) {
	const postId = params.postId;
	if(!postId){
		return ConstructResponseWithCode(400);
	}

	try{
		const comments = await CommentManager.GetCommentsForPost(postId);

		let sanitizedComments: SanitizedComment[] = [];

		const sanitizationFunction = GetCommentSanitizationFunctionForUser(locals.jwt);
		sanitizedComments = comments.map(sanitizationFunction);
		
		const responseData: APITypes.Posts.Comment.Get.Response = {
			comments: sanitizedComments
		}

		return json(responseData);
	}catch(error){
		return ConstructResponseWithCode(500);
	}
};

function getCreateCommentParamsFromRequest(request: Request): Promise<APITypes.Posts.Comment.Create.Request | null> {
	return new Promise<APITypes.Posts.Comment.Create.Request | null>(async (resolve, reject) => {
		const body: any = await request.json().catch(() => null);	
		if(body === null) return resolve(null);
		
		if(typeof body.content !== 'string'){
			return resolve(null);
		}

		if(typeof body.anonymous !== 'boolean'){
			return resolve(null);
		}

		const params: APITypes.Posts.Comment.Create.Request = {
			content: body.content,
			anonymous: body.anonymous
		}

		return resolve(params);
	});
}

// Create a comment for a post
export async function POST({ request, params, locals }: RequestEvent) {
	const postId = params.postId;
	if(!postId){
		return ConstructResponseWithCode(400);
	}

	if(!locals.jwt){
		return ConstructResponseWithCode(401);
	}

	const createCommentParams = await getCreateCommentParamsFromRequest(request).catch(() => null);
	if(!createCommentParams){
		return ConstructResponseWithCode(400);
	}

	try{
		const createResult = await CommentManager.CreateComment(
			postId,
			locals.jwt.userId,
			createCommentParams.content.trim(),
			createCommentParams.anonymous
		);

		if(createResult.success === false){
			switch(createResult.error){
				case "commenting_violates_limits":
					return ConstructApiErrorJSON(ErrorCode.Comments.COMMENTING_VIOLATES_LIMIT_RULES, 403);
				case "user_not_found":
					return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
				case "user_suspended":
					return ConstructApiErrorJSON(ErrorCode.User.SUSPENDED, 403);
				case "post_not_found":
					return ConstructApiErrorJSON(ErrorCode.Posts.POST_NOT_FOUND, 404);
				case "comment_too_long":
					return ConstructApiErrorJSON(ErrorCode.Comments.COMMENT_TOO_LONG, 403);
				case "post_too_old_to_comment_on":
					return ConstructApiErrorJSON(ErrorCode.Comments.POST_TOO_OLD_TO_COMMENT_ON, 403);
				default:
					return ConstructResponseWithCode(500);
			}
		}

		return ConstructResponseWithCode(201);
	}catch(error){
		return ConstructResponseWithCode(500);
	}
}