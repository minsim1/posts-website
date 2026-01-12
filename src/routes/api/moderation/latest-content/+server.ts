import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { GetPostSanitizationFunctionForUser, GetCommentSanitizationFunctionForUser } from '$lib/server/helpers/sanitization';
import type { APITypes } from '$lib/api/types';
import PostManager from '$lib/server/managers/post-manager';
import CommentManager from '$lib/server/managers/comment-manager';
import { CONFIG } from '../../../../public-config';

export async function GET({ url, locals }: RequestEvent) {
	const afterParam = url.searchParams.get('after');

	if (!afterParam) {
		return ConstructResponseWithCode(400);
	}

	const after = parseInt(afterParam);

	if (isNaN(after) || after < 0) {
		return ConstructResponseWithCode(400);
	}

	const now = Date.now();
	const maxRange = CONFIG.moderation.maxModContentQueryRange;

	// Check if the query range is too large
	if (now - after > maxRange) {
		return ConstructResponseWithCode(400);
	}

    if(!locals.jwt || (locals.jwt.role != "moderator" && locals.jwt.role != "admin")){
        return ConstructResponseWithCode(403);
    }

	try {
		// Fetch posts and comments after the specified timestamp
		const [posts, comments] = await Promise.all([
			PostManager.GetPostsAfterTimestamp(after),
			CommentManager.GetCommentsAfterTimestamp(after)
		]);

		// Sanitize posts and comments
		const sanitizePost = GetPostSanitizationFunctionForUser(locals.jwt);
		const sanitizeComment = GetCommentSanitizationFunctionForUser(locals.jwt);

		const sanitizedPosts = posts.map(sanitizePost);
		const sanitizedComments = comments.map(sanitizeComment);

		const response: APITypes.Moderation.LatestContent.Response = {
			posts: sanitizedPosts,
			comments: sanitizedComments
		};

		return json(response);
	} catch (error) {
		console.error('Error fetching latest content:', error);
		return ConstructResponseWithCode(500);
	}
}
