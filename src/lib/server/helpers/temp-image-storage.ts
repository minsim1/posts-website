import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

export class TempImageStorage{
    private storage: Map<string, File> = new Map();

    constructor(
        private domain: string
    ){}

    public StoreImage(id: string, data: File){
        this.storage.set(id, data);
    }

    public GetImage(id: string): File | null {
        return this.storage.get(id) || null;
    }

    public DeleteImage(id: string): boolean {
        return this.storage.delete(id);
    }

    public GetImageCurrentServerUrlById(id: string): string | null {
        return this.domain + `/api/temp-content/${id}`;
    }
}

const tempImageStorage = building ?
    null as unknown as TempImageStorage :
    new TempImageStorage(env.DOMAIN);

export default tempImageStorage;