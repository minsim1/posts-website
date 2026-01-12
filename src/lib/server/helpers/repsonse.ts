import type { Cookies } from "@sveltejs/kit";
import { GenerateToken, type JWT } from "./auth";

export function ConstructResponseWithCode(code: number){
    return new Response(null, { status: code });
}

export function AddJWTCookie(cookies: Cookies, jwtPaload: JWT, expiresIn: number){
    const jwtToken = GenerateToken(jwtPaload, expiresIn);

    cookies.set('Bearer', jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: expiresIn / 1000
    });
}

export function AddRefreshTokenCookie(cookies: Cookies, sessionId: string, maxAgeMS: number){
    cookies.set('RefreshToken', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: maxAgeMS / 1000
    });
}