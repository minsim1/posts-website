import { json, type RequestEvent } from '@sveltejs/kit';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import type { APITypes, AdminAPITypes } from '$lib/api/types';
import UserManager from '$lib/server/managers/user-manager';
import type { UserRole } from '$lib/server/db/types';

export async function GET({ url, locals }: RequestEvent) {
	if (!locals.jwt || locals.jwt.role !== 'admin') {
		return ConstructResponseWithCode(403);
	}

	try {
		const roleParam = url.searchParams.get('role') as UserRole | null;
		const usernameParam = url.searchParams.get('username');
		const users = await UserManager.GetAllUsers(roleParam || undefined, usernameParam || undefined);

		const responseData: APITypes.Admin.Users.Query.Response = {
			users: users.map(user => ({
				id: user._id.toString(),
				username: user.username,
				role: user.role
			}))
		};

		return json(responseData);
	} catch (error) {
		console.error('Error querying users:', error);
		return ConstructResponseWithCode(500);
	}
}
