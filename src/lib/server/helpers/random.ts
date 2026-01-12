import crypto from 'crypto';

export function GetRandomSessionId(){
    return crypto.randomBytes(32).toString('hex');
}