import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import { SessionManager } from '$lib/server/managers/session-manager';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function POST({ cookies, locals }: RequestEvent) {
	// Clear authentication cookie
	cookies.delete('Bearer', {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/'
	});

	// Clear refresh token cookie
	cookies.delete('RefreshToken', {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: "/api/auth"
	});

	if(locals.refreshToken){
		await SessionManager.DeleteSession(locals.refreshToken);
	}

	return ConstructResponseWithCode(200);
};
