// Username checks

import { CONFIG } from "../../public-config";

const MAX_USERNAME_LENGTH = CONFIG.username.maxLength
const MIN_USERNAME_LENGTH = CONFIG.username.minLength
const MAX_PASSWORD_LENGTH = CONFIG.password.maxLength
const MIN_PASSWORD_LENGTH = CONFIG.password.minLength

const validUsernameCharacters = /^[a-zA-Z0-9_]+$/;

export function CheckUsernameValidity(
    username: string,
    disallowedUsernamePatterns: string[]
) : {
    valid: boolean;
    error?: `too_short` | "too_long" | "invalid_characters" | "disallowed_pattern";
    disallowedPattern?: string;
} {
    if (username.length < MIN_USERNAME_LENGTH) {
        return {
            valid: false,
            error: 'too_short'
        }
    }

    if (username.length > MAX_USERNAME_LENGTH) {
        return {
            valid: false,
            error: 'too_long'
        }
    }

    if(!validUsernameCharacters.test(username)) {
        return {
            valid: false,
            error: 'invalid_characters'
        }
    }

    for (const pattern of disallowedUsernamePatterns) {
        const lowercasePattern = pattern.toLowerCase();
        const lowercaseUsername = username.toLowerCase();

        if (lowercaseUsername.includes(lowercasePattern)) {
            return {
                valid: false,
                error: 'disallowed_pattern',
                disallowedPattern: pattern
            }
        }
    }

    return {
        valid: true,
    }
}

// Password checks

export function CheckPasswordValidity(
    password: string,
) : {
    valid: boolean;
    error?: `too_short` | "too_long"
} {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return {
            valid: false,
            error: 'too_short'
        }
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        return {
            valid: false,
            error: 'too_long'
        }
    }

    return {
        valid: true,
    }
}

// Post checks

export function CheckPostContentValidity(
    content: string,
    maxContentLength: number,
) : {
    valid: boolean,
    reason?: "too_long"
} {
    if(content.length > maxContentLength) {
        return {
            valid: false,
            reason: "too_long"
        }
    }

    return {
        valid: true
    }
}