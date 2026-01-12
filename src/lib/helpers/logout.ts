import { API } from "$lib/api/api";
import LocalStorageHelper from "$lib/client/helpers/local-storage";

export async function LogOut(){
    const response = await API.auth.logout();
    if(response.success){
        LocalStorageHelper.ClearUserDataCache();
        LocalStorageHelper.ClearJwtExpirationTimestamp();
        window.location.href = '/login';
    }
}

export async function LogOutEverywhere(){
    const response = await API.auth.logoutEverywhere();
    if(response.success){
        LocalStorageHelper.ClearUserDataCache();
        LocalStorageHelper.ClearJwtExpirationTimestamp();
        window.location.href = '/login';
    }
}