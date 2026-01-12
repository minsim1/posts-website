import LocalStorageHelper from "../helpers/local-storage";
import { EN_errorStrings } from "./en/errors";
import { EN_genericStrings } from "./en/generic";
import { LT_errorStrings } from "./lt/errors";
import { LT_genericStrings } from "./lt/generic";
import type { Strings } from "./types";

export const Languages = ['en', 'lt'] as const;
export type Language = typeof Languages[number];
export const DefaultLanguage: Language = 'en';

export const ALL_STRINGS: Record<Language, Strings> = {
    'en':{
        errors: EN_errorStrings,
        generic: EN_genericStrings,
    },
    'lt':{
        errors: LT_errorStrings,
        generic: LT_genericStrings,
    }
}

function createDeepProxy(pathGetter: () => any): any {
    return new Proxy({}, {
        get(target, prop) {
            const value = pathGetter()[prop];
            
            // If the value is an object, wrap it in another proxy
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                return createDeepProxy(() => value);
            }
            
            return value;
        }
    });
}

export const STRINGS = createDeepProxy(() => {
    const lang = LocalStorageHelper.language.get();
    return ALL_STRINGS[lang];
}) as Strings;