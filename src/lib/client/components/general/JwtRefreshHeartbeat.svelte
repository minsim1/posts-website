<script lang='ts'>
    import { onMount, onDestroy } from 'svelte';
    import { CONFIG } from '../../../../public-config';
    import LocalStorageHelper from '$lib/client/helpers/local-storage';
    import { API } from '$lib/api/api';
    let timeout: NodeJS.Timeout;

    onMount(()=>{
        timeout = setInterval(async ()=>{

            const expiresAt = LocalStorageHelper.GetJwtExpirationTimestamp();
            if(!expiresAt) return
            const currentTime = Date.now();
            const timeLeft = expiresAt - currentTime;
            if(timeLeft > CONFIG.jwt.heartbeat.refreshIfTimeLeftLessThan) return;

            // Refresh JWT
            const response = await API.auth.refresh();
            if(response.success){
                LocalStorageHelper.SetJwtExpirationTimestamp(response.data.jwtExpiresAtTimestamp);
            }
        }, CONFIG.jwt.heartbeat.interval)
    })

    onDestroy(()=>{
        clearInterval(timeout);
    })
</script>