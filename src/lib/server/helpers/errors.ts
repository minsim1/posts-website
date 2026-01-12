import { ErrorCodeMessages } from "$lib/api/api-errors";
import type { AllErrorCodes, ErrorResponse } from "$lib/api/types";
import { json } from "@sveltejs/kit";

export function ConstructApiErrorJSON(errorCode: AllErrorCodes, status: number){
    const errorResponse: ErrorResponse = {
        error: {
            code: errorCode,
            message: ErrorCodeMessages[errorCode]
        }
    }

    return json(errorResponse, { status });
}