import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

export class InstagramHelper {
    private BASE_URL = 'https://graph.instagram.com/v24.0';

    constructor(
        private apiKey: string,
        private userId: string
    ){
        if(!this.apiKey) throw new Error('Instagram API key is not set in environment variables.');
        if(!this.userId) throw new Error('Instagram User ID is not set in environment variables.');
    }

    private async makeRequest(
        endpoint: string,
        method: 'GET' | 'POST',
        urlParams: Record<string, string> = {},
        passUserId: boolean = true
    ){
        const url = new URL(`${this.BASE_URL}${passUserId ? `/${this.userId}` : ''}/${endpoint}`);
        url.searchParams.append('access_token', this.apiKey);
        for(const [key, value] of Object.entries(urlParams)){
            url.searchParams.append(key, value);
        }

        return await fetch(url.toString(), {
            method,
        });
    }

    /**
     * Uploads an image to Instagram and returns the container id
     */
    async UploadImage(url: string, carousel = true, numConfirmationOfTries = 10, confirmationIntervalMs = 3000): Promise<string>{
        // Create upload session
        const params = {
            image_url: url,
            is_carousel_item: carousel ? 'true' : 'false',
        }

        const response = await this.makeRequest('media', 'POST', params);
        const data = await response.json();
        const containerId = data.id;

        // Validate the upload process
        for(let attempt = 0; attempt < numConfirmationOfTries; attempt++){
            await new Promise(res => setTimeout(res, confirmationIntervalMs));

            const statusResponse = await this.makeRequest(containerId, 'GET', {
                fields: 'status_code'
            }, false);
            const statusData = await statusResponse.json();

            if(statusData.status_code === "FINISHED"){
                return containerId;
            }else if(statusData.status_code === "ERROR"){
                throw new Error('Instagram media upload failed.');
            }else{
                // Retry
            }
        }

        throw new Error('Instagram media upload timed out.');
    }

    /**
     * Creates a carousel container from multiple container ids and returns the carousel container id
     */
    async CreateCarouselContainer(containerIds: string[], caption?: string, numOfConfirmationTries = 10, confirmationIntervalMs = 3000): Promise<string>{
        const params = {
            media_type: 'CAROUSEL',
            children: containerIds.join(','),
        } as any;

        if(caption) params.caption = caption;

        const response = await this.makeRequest('media', 'POST', params);
        const data = await response.json();
        const carouselId = data.id;
        if(!carouselId){
            throw new Error('Failed to create carousel container.');
        }

        for(let i = 0; i < numOfConfirmationTries; i++){
            await new Promise(res => setTimeout(res, confirmationIntervalMs));

            // Check the status of the CAROUSEL container
            const statusResponse = await this.makeRequest(carouselId, 'GET', {
                fields: 'status_code'
            }, false);
            const statusResponseData = await statusResponse.json();

            const status = statusResponseData.status_code;

            if(status === 'FINISHED'){
                return carouselId;
            } 
            
            if(status === 'ERROR' || statusResponseData.error) {
                throw new Error('Carousel container failed processing.');
            }
        }

        throw new Error('Carousel container processing timed out.');
    }

    async PublishMedia(containerId: string): Promise<boolean>{
        const params = {
            creation_id: containerId,
        }

        const response = await this.makeRequest('media_publish', 'POST', params);
        return response.ok;
    }
}

const instagramHelper = !building 
    ? new InstagramHelper(env.INSTAGRAM_API_KEY, env.INSTAGRAM_USER_ID)
    : null as unknown as InstagramHelper;

export default instagramHelper;