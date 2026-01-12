import type { RequestHandler } from './$types';
import tempImageStorage from '$lib/server/helpers/temp-image-storage';
import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import instagramHelper from '$lib/server/helpers/instagram.js';
import type { APITypes } from '$lib/api/types.js';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';

export async function POST({ request }): Promise<Response> {
    // Before calling this endpoint,
    // make sure you have prayed to the randomness gods,
    // so you don't get an in-use ID. 🙏
    const idToUse = randomUUID();

    try {
        // Get the form data
        const formData = await request.formData();
        const image = formData.get('image') as File | null;

        if (!image)  return ConstructResponseWithCode(400);

        // Store the image temporarily
        tempImageStorage.StoreImage(idToUse, image);
        const imageUrl = tempImageStorage.GetImageCurrentServerUrlById(idToUse);
        if(!imageUrl){
            return ConstructResponseWithCode(500);
        }

        // Upload the image to Instagram
        const containerId = await instagramHelper.UploadImage(imageUrl)
        tempImageStorage.DeleteImage(idToUse);

        // Return the container ID
        const respose: APITypes.Admin.Instagram.UploadImage.Response = {
            containerId: containerId
        }

        return json(respose);
    } catch (error) {
        return ConstructResponseWithCode(500);
    }finally{
        // Clean up the stored image after some time
        tempImageStorage.DeleteImage(idToUse);
    }
};
