import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { GetPostSanitizationFunctionForUser } from '$lib/server/helpers/sanitization';
import { ErrorCode, type APITypes, type SanitizedPost } from '$lib/api/types';
import { configManager } from '$lib/server/managers/config-manager';
import { CheckPostContentValidity } from '$lib/helpers/validation';
import { CONFIG } from '../../../public-config';
import { ConstructApiErrorJSON } from '$lib/server/helpers/errors';
import PostManager from '$lib/server/managers/post-manager';
import VoteManager from '$lib/server/managers/vote-manager';

function validInteger(value: string | null): boolean {
	if(value === null) return false;
	const num = Number(value);
	return Number.isInteger(num);
}

// Query posts
export async function GET({ cookies, url, locals }: RequestEvent) {
	const dateRangeStartStr = url.searchParams.get('start');
	const dateRangeEndStr = url.searchParams.get('end');

	if(!dateRangeStartStr || !dateRangeEndStr){
		return ConstructResponseWithCode(400);
	}

	if(!validInteger(dateRangeStartStr) || !validInteger(dateRangeEndStr)){
		return ConstructResponseWithCode(400);
	}

	const dateRangeStart = parseInt(dateRangeStartStr, 10);
	const dateRangeEnd = parseInt(dateRangeEndStr, 10);

	if(dateRangeEnd < dateRangeStart){
		return ConstructResponseWithCode(400);
	}

	const maxDateRange = CONFIG.posts.query.maxDateRange;
	if((dateRangeEnd - dateRangeStart) > maxDateRange){
		return ConstructResponseWithCode(400);
	}

	try{
		const daysPosts = await PostManager.GetPostsByDateRange(dateRangeStart, dateRangeEnd);

		let sanitizedPosts: SanitizedPost[] = [];

		if(locals.jwt){
			const relevantVotes = await VoteManager.GetUserVotesForPosts(locals.jwt.userId, daysPosts.map(post => post._id.toString()))
			sanitizedPosts = daysPosts.map(GetPostSanitizationFunctionForUser(locals.jwt, relevantVotes));
		}else{
			sanitizedPosts = daysPosts.map(GetPostSanitizationFunctionForUser());
		}

		const responseData: APITypes.Posts.Query.Response = {
			posts: sanitizedPosts
		}

		return json(responseData);
	}catch(error){
		return ConstructResponseWithCode(500);
	}
};

async function getValidPostCreateParamsFromRequest(request: Request): Promise<APITypes.Posts.Create.Request | null>{
	const data = await request.json();

	if(!data || !data.content || data.anonymous == undefined || data.anonymous == null) return null;
	if(typeof data.content !== "string") return null;
	if(typeof data.anonymous !== "boolean") return null;

	const config = await configManager.GetConfig();
	const validContent = CheckPostContentValidity(data.content, config.limits.maxPostLength);

	if(!validContent.valid) return null;

	return {
		content: data.content,
		anonymous: data.anonymous
	}
}

// Create posts
export async function POST({ cookies, url, locals, request }: RequestEvent) {
	const createParams = await getValidPostCreateParamsFromRequest(request);
	if(!createParams) return ConstructResponseWithCode(400);

	if(!locals.jwt) return ConstructResponseWithCode(401);

	try{
		const result = await PostManager.CreatePost({
			anonymous: createParams.anonymous,
			body: createParams.content.trim(),
			authorUserId: locals.jwt.userId
		})

		if(result.success == false){
			if(result.error == "unknown_error"){
				return ConstructResponseWithCode(500);		
			}

			if(result.error == "user_not_found"){
				return ConstructApiErrorJSON(ErrorCode.User.USER_NOT_FOUND, 404)
			}

			if(result.error == "user_suspended"){
				return ConstructApiErrorJSON(ErrorCode.User.SUSPENDED, 403)
			}

			if(result.error == "posting_violates_limit_rules"){
				return ConstructApiErrorJSON(ErrorCode.Posts.POSTING_VIOLATES_LIMIT_RULES, 403)
			}

			if(result.error == "post_too_long"){
				return ConstructApiErrorJSON(ErrorCode.Posts.POST_TOO_LONG, 413)
			}

			return ConstructResponseWithCode(500);
		}else if(result.success == true){
			const responseData: APITypes.Posts.Create.Response = {
				postId: result.postId
			}
	
			return json(responseData, { status: 201 });
		}
	}catch(error){
		return ConstructResponseWithCode(500);
	}
};