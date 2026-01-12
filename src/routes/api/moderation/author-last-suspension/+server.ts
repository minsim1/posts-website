import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { GetPostSanitizationFunctionForUser } from '$lib/server/helpers/sanitization';
import { ErrorCode, type APITypes, type SanitizedPost } from '$lib/api/types';
import { configManager } from '$lib/server/managers/config-manager';
import { CheckPostContentValidity } from '$lib/helpers/validation';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import PostManager from '$lib/server/managers/post-manager';
import VoteManager from '$lib/server/managers/vote-manager';
import CommentManager from '$lib/server/managers/comment-manager';

export async function GET({ cookies, url, locals, request }: RequestEvent) {
	const type = url.searchParams.get('type');
	const id = url.searchParams.get('id');

	if(!type || !id){
		return ConstructResponseWithCode(400);
	}
	
	if(typeof type !== 'string' || typeof id !== 'string'){
		return ConstructResponseWithCode(400);
	}

	if(type !== 'comment' && type !== 'post'){
		return ConstructResponseWithCode(400);
	}

	try{
		if(type == "post"){
			const result = await PostManager.GetLastAuthorSuspension(id);

			if(result.success == false){
				if(result.error == "post_not_found"){
					return ConstructApiErrorJSON(ErrorCode.Posts.POST_NOT_FOUND, 404);
				}

				if(result.error == "user_not_found"){
					return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
				}

				if(result.error = "author_id_expunged"){
					return ConstructApiErrorJSON(ErrorCode.Moderation.AUTHOR_ID_EXPUNGED, 404);
				}

				return ConstructResponseWithCode(500);
			}else{
				const responseData: APITypes.Moderation.AuthorLastSuspension.Response = {
					suspension: result.suspension
				}

				return json(responseData);
			}
		}else if(type == "comment"){
			const result = await CommentManager.GetLastAuthorSuspension(id);

			if(result.success == false){
				if(result.error == "comment_not_found"){
					return ConstructApiErrorJSON(ErrorCode.Comments.COMMENT_NOT_FOUND, 404);
				}
				
				if(result.error == "user_not_found"){
					return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404);
				}

				if(result.error = "author_id_expunged"){
					return ConstructApiErrorJSON(ErrorCode.Moderation.AUTHOR_ID_EXPUNGED, 404);
				}

				return ConstructResponseWithCode(500);
			}else{
				const responseData: APITypes.Moderation.AuthorLastSuspension.Response = {
					suspension: result.suspension
				}

				return json(responseData);
			}
		}
	}catch(err){
		return ConstructResponseWithCode(500);
	}
}