import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import type { UserRole } from '../db/types';

const JWT_SECRET = env.JWT_SECRET;

export interface JWT {
	userId: string;
	username: string;
	role: UserRole;
	iat: number;
}

export function GenerateToken(payload: JWT, expiresIn: number): string {
    if(!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

	return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn });
}

export function VerifyToken(token: string): JWT | null {
    if(!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
	try {
		return jwt.verify(token, JWT_SECRET) as JWT;
	} catch {
		return null;
	}
}

