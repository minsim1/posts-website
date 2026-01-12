import type { RequestHandler } from './$types';
import tempImageStorage from '$lib/server/helpers/temp-image-storage';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';

export const GET: RequestHandler = async ({ params }) => {
    const { id } = params;

    // Get the image from storage
    const imageFile = tempImageStorage.GetImage(id);

    if (!imageFile) {
        return ConstructResponseWithCode(404);
    }

    // Return the image with the correct content type
    return new Response(imageFile, {
        headers:{
            'Content-Type': imageFile.type,
            'Content-Disposition': "inline; filename=\"" + id + "\""
        }
    })
};