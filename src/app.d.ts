// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { JWT } from '$lib/server/helpers/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			jwt?: JWT;
			refreshToken?: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
