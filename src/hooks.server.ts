import { configManager } from "$lib/server/managers/config-manager";
import { connectDB } from "$lib/server/db/database";
import type { UserRole } from "$lib/server/db/types";
import { VerifyToken, type JWT } from "$lib/server/helpers/auth";
import { ConstructResponseWithCode } from "$lib/server/helpers/repsonse";
import type { Handle } from "@sveltejs/kit";
import { env } from '$env/dynamic/private';

// This only maps routes that MUST have a valid JWT
// Endpoints that work even without authentication (like posts or comments fetching) are not included here
const routesToRolesMap: Record<string, UserRole[]> = {
    '/api/admin': ['admin'],
    '/api/moderation': ['admin', 'moderator'],
    '/api/user': ['admin', 'moderator', 'user']
}

const dbRequiringRoutes: string[] = [
    '/api/admin',
    '/api/user',
    '/api/posts',
    '/api/auth'
]

const SIMULATE_API_DELAY = false;

function addValidJWTToLocals(event: any) {
    try{
        const token = event.cookies.get('Bearer');
        if (!token) return
        
        const payload = VerifyToken(token);
        if (!payload) return
        
        // Verify function already checks expiration
        // if(!payload.exp || Date.now() > payload.exp) return

        event.locals.jwt = payload;
    }catch(e){
        return;
    }
}

function addRefreshTokenToLocals(event: any) {
    try{
        const refreshToken = event.cookies.get('RefreshToken');
        if (!refreshToken) return;

        event.locals.refreshToken = refreshToken;
    }catch(e){
        return;
    }
}

export const handle: Handle = async ({ event, resolve }) => {
    addValidJWTToLocals(event);
    addRefreshTokenToLocals(event);

    if(SIMULATE_API_DELAY && env.DEV == 'true' && event.url.pathname.startsWith('/api/')) {
        const minDelay = 1000;
        const maxDelay = 2000;
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        await new Promise((r) => setTimeout(r, delay));
    }

    for(const routePrefix in routesToRolesMap) {
        if (event.url.pathname.startsWith(routePrefix)) {
            const jwt = event.locals.jwt as JWT | undefined;
            if(!jwt) {
                return ConstructResponseWithCode(401);
            }

            const allowedRoles = routesToRolesMap[routePrefix];
            if(!allowedRoles.includes(jwt.role)) {
                return ConstructResponseWithCode(403);
            }
        }
    }

    for(const routePrefix of dbRequiringRoutes) {
        if (event.url.pathname.startsWith(routePrefix)) {
            // Connect to DB
            await connectDB();
            break;
        }
    }

    const response = await resolve(event);

    // Iframe protection headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Content-Security-Policy', "frame-ancestors 'none'");

    // Other security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    return response;
};