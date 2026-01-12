import { ConstructResponseWithCode } from '$lib/server/helpers/repsonse';
import instagramHelper from '$lib/server/helpers/instagram.js';
import type { APITypes } from '$lib/api/types.js';

async function getParametersFromRequest(request: Request): Promise<APITypes.Admin.Instagram.CreatePost.Request | null> {
    try{
        const data = (await request.json()) as APITypes.Admin.Instagram.CreatePost.Request;
        if(!data) return null
        if(typeof data !== 'object') return null;
        if(!data.containerIds || typeof data.containerIds !== 'object' || !Array.isArray(data.containerIds)) return null;
        if(data.containerIds.length === 0) return null;
        for(const id of data.containerIds){
            if(typeof id !== 'string' || id.length === 0){
                return null;
            }
        }

        // Instagram carousel limits (2-10 images)
        // Posting just one image is not allowed
        if(data.containerIds.length > 10){
            return null;
        }
        if(data.containerIds.length < 2){
            return null;
        }

        if(data.caption && typeof data.caption !== 'string'){
            return null;
        }

        return data as APITypes.Admin.Instagram.CreatePost.Request;
    }catch(e){
        return null;
    }
}

export async function POST({ request }): Promise<Response> {
    try {
        const params = await getParametersFromRequest(request);
        if(!params){
            return ConstructResponseWithCode(400);
        }

        // Create carousel container
        const parentContainerId = await instagramHelper.CreateCarouselContainer(params.containerIds, params.caption);
        if(!parentContainerId){
            return ConstructResponseWithCode(500);
        }

        // Publish carousel post
        const success = await instagramHelper.PublishMedia(parentContainerId);
        if(!success){
            return ConstructResponseWithCode(500);
        }
        
        return ConstructResponseWithCode(200);
    } catch (error) {
        return ConstructResponseWithCode(500);
    }
};
