import bcrypt from 'bcrypt';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

export function HashString(rawString: string): Promise<string> {
    const SALT_ROUNDS = env.PASSWORD_HASHING_ROUNDS;

    if (!SALT_ROUNDS) {
        throw new Error('PASSWORD_HASHING_ROUNDS is not defined in environment variables');
    }

    return bcrypt.hash(rawString, parseInt(SALT_ROUNDS));
}

export function CompareStringWithHash(rawString: string, hashedString: string): Promise<boolean> {
    return bcrypt.compare(rawString, hashedString);
}

export function HashStringSHA256(rawString: string): string {
    return crypto.createHash('sha256').update(rawString).digest('hex');
}