import { API } from "$lib/api/api";
import type { APITypes, SanitizedConfig, SanitizedUser } from "$lib/api/types";
import { DefaultLanguage, Languages, type Language } from "../strings/main";

const UserDataCacheTimeMS = 5 * 60 * 1000; // 5 minutes
const ServerConfigCacheTimeMS = 5 * 60 * 1000; // 5 minutes

export default class LocalStorageHelper {
    // Language preference
    public static language = {
        get: (): Language => {
            if (typeof window === 'undefined') return DefaultLanguage;
            const lang = localStorage.getItem("language");
            if(!lang) return DefaultLanguage;
            if(!Languages.includes(lang as Language)) return DefaultLanguage;
            return lang as Language;
        },
        set: (lang: Language) => {
            if (typeof window === 'undefined') return;
            localStorage.setItem("language", lang);
        },
        remove: () => {
            if (typeof window === 'undefined') return;
            localStorage.removeItem("language");
        }
    }

    // User data

    private static lastTimeUserDataFetchedKey = "lastTimeUserDataFetched";
    
    private static get lastTimeUserDataFetched(): number {
        if (typeof window === 'undefined') return 0;
        const timestamp = localStorage.getItem(LocalStorageHelper.lastTimeUserDataFetchedKey);
        if(!timestamp) return 0;
        return parseInt(timestamp, 10);
    }

    private static set lastTimeUserDataFetched(value: number) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(LocalStorageHelper.lastTimeUserDataFetchedKey, value.toString());
    }

    private static async fetchUserData(): Promise<APITypes.User.GetData.Response | null> {
        if(typeof window === 'undefined') return null;
        const response = await API.user.get();
        if(!response.success) return null;
        return response.data;
    }

    public static async GetUserData(): Promise<SanitizedUser | null>{
        if(typeof window === 'undefined') return null;

        const cachedData = localStorage.getItem("userData");

        const now = Date.now();
        if(now - LocalStorageHelper.lastTimeUserDataFetched > UserDataCacheTimeMS || !cachedData || cachedData === "undefined"){
            const userData = await LocalStorageHelper.fetchUserData();
            if(userData){
                localStorage.setItem("userData", JSON.stringify(userData.user));
                LocalStorageHelper.lastTimeUserDataFetched = now;
                return userData.user;
            }else{
                return null;
            }
        }else{
            return JSON.parse(cachedData) as SanitizedUser;
        }
    }

    public static ClearUserDataCache(){
        if(typeof window === 'undefined') return;
        localStorage.removeItem("userData");
        LocalStorageHelper.lastTimeUserDataFetched = 0;
    }

    public static InvalidateUserDataCache(){
        if(typeof window === 'undefined') return;
        LocalStorageHelper.lastTimeUserDataFetched = 0;
    }

    // Server config data
    public static ClearServerConfigCache(){
        if(typeof window === 'undefined') return;
        localStorage.removeItem("serverConfigData");
        localStorage.removeItem("lastTimeServerConfigFetched");
    }

    public static async GetServerConfigData(): Promise<SanitizedConfig | null>{
        if(typeof window === 'undefined') return null;

        const cachedData = localStorage.getItem("serverConfigData");

        const lastFetchedStr = localStorage.getItem("lastTimeServerConfigFetched");
        const now = Date.now();
        if(!lastFetchedStr || now - parseInt(lastFetchedStr, 10) > ServerConfigCacheTimeMS || !cachedData || cachedData === "undefined"){
            const response = await API.serverConfig.get();
            if(!response.success) return null;
            localStorage.setItem("serverConfigData", JSON.stringify(response.data.config));
            localStorage.setItem("lastTimeServerConfigFetched", now.toString());
            return response.data.config;
        }else{
            return JSON.parse(cachedData) as SanitizedConfig;
        }
    }

    public static GetJwtExpirationTimestamp(): number | null {
        if(typeof window === 'undefined') return null;
        const expStr = localStorage.getItem("jwtExpirationTimestamp");
        if(!expStr) return null;
        const exp = parseInt(expStr, 10);
        if(isNaN(exp)) return null;
        return exp;
    }

    public static SetJwtExpirationTimestamp(timestamp: number){
        if(typeof window === 'undefined') return;
        localStorage.setItem("jwtExpirationTimestamp", timestamp.toString());
    }

    public static ClearJwtExpirationTimestamp(){
        if(typeof window === 'undefined') return;
        localStorage.removeItem("jwtExpirationTimestamp");
    }
}