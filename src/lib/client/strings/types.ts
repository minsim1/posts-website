import type { AllErrorCodes } from "$lib/api/types";

export interface GenericStrings{
    unknownError: string;
    login:{
        suspension:{
            main: string;
            reasonPrefix: string;
            suspendedUntilPrefix: string;
            permanentSuspension: string;
        }
    },
    auth:{
        username: string;
        password: string;
    },
    posts:{
        create:{
            placeholderSlogans: string[];
        }
    },
    comments:{
        create:{
            placeholder: string,
        }
    }
}

export interface Strings{
    errors: Record<AllErrorCodes, string>;
    generic: GenericStrings;
}

