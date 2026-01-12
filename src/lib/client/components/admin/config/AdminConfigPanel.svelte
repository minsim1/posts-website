<script lang='ts'>
    import type { APITypes } from "$lib/api/types";
    import { onMount } from "svelte";
    import ServerNumberConfigModify from "./ServerNumberConfigModify.svelte";
    import { API } from "$lib/api/api";
    import { STRINGS } from "$lib/client/strings/main";
    import ServerStringListConfigModify from "./ServerStringListConfigModify.svelte";
    import ServerUserInteractionLimitsConfigModify from "./ServerUserInteractionLimitsConfigModify.svelte";

    let serverConfig: APITypes.Admin.GetServerConfig.Response;
    let loading = true;
    let error = "";

    async function loadServerConfig(){
        error = "";

        loading = true;
        const response = await API.admin.getConfig();
        loading = false;

        if(response.success == true){
            serverConfig = response.data;
            return;
        }else{
            if(response.status == 401 || response.status == 403){
                window.location.href = "/login"
                return;
            }

            if(response.error){
                error = STRINGS.errors[response.error.code]
                return;
            }else{
                error = STRINGS.generic.unknownError + ` (${response.status})`
            }
        }
    }

    onMount(()=>{
        loadServerConfig()
    })
</script>

<h1>Server configuration panel</h1>

{#if loading}
    Loading...
{:else if error}
    <div class="error">{error}</div>
{:else}
    <div class="container">
        <h2>User interaction limits</h2>

        <ServerUserInteractionLimitsConfigModify
            currentLimits={serverConfig.config.userInteractionLimits}
            refreshCallback={loadServerConfig}
        />

        <h2>Disallowed username patterns</h2>
        <ServerStringListConfigModify
            label="Disallowed username patterns"
            currentValues={serverConfig.config.disallowedUsernamePatterns}
            addStringToConfigFunc={(str)=>{return {newDisallowedUsernamePatterns: [str]}}}
            removeStringFromConfigFunc={(str)=>{return {removeDisallowedUsernamePatterns: [str]}}}
            refreshCallback={loadServerConfig}
        />

        <hr/>

        <h2>Content rules</h2>
        <ServerStringListConfigModify
            label="Content posting rules"
            currentValues={serverConfig.config.postingRules}
            addStringToConfigFunc={(str)=>{return {newPostingRules: [str]}}}
            removeStringFromConfigFunc={(str)=>{return {removePostingRules: [str]}}}
            refreshCallback={loadServerConfig}
        />

        <hr/>

        <h2>Discord Webhooks</h2>
        <ServerStringListConfigModify
            label="Posts Discord webhook URLs"
            currentValues={serverConfig.config.postsDiscordWebhookUrls}
            addStringToConfigFunc={(str)=>{return {newPostsDiscordWebhookUrls: [str]}}}
            removeStringFromConfigFunc={(str)=>{return {removePostsDiscordWebhookUrls: [str]}}}
            refreshCallback={loadServerConfig}
        />

        <hr/>

        <h2>User interactions</h2>
        <ServerNumberConfigModify 
            label="Max interactions to save"
            numberType="integer"
            numberToConfigFunc={(num)=>{return {setMaxInteractionsToSave: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.maxInteractionsToSave}
        />
    
        <hr/>

        <ServerNumberConfigModify 
            label="Max interaction age to save"
            numberType="time_ms"
            numberToConfigFunc={(num)=>{return {setMaxInteractionAgeToSave: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.maxInteractionAgeToSave}
        />
        <hr/>

        <h2>Content limits</h2>
        <ServerNumberConfigModify 
            label="Max characters in post"
            numberType="integer"
            numberToConfigFunc={(num)=>{return {setMaxPostLength: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.maxPostLength}
        />
    
        <hr/>

        <ServerNumberConfigModify 
            label="Max characters in comment"
            numberType="integer"
            numberToConfigFunc={(num)=>{return {setMaxCommentLength: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.maxCommentLength}
        />

        <h2>Deletion limits</h2>
        <ServerNumberConfigModify 
            label="Max post age to allow deletion"
            numberType="time_ms"
            numberToConfigFunc={(num)=>{return {setMaxPostAgeToAllowDelete: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.maxPostAgeToAllowDelete}
        />
    
        <hr/>

        <ServerNumberConfigModify 
            label="Max comment age to allow deletion"
            numberType="time_ms"
            numberToConfigFunc={(num)=>{return {setMaxCommentAgeToAllowDelete: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.maxCommentAgeToAllowDelete}
        />

        <hr/>

        <ServerNumberConfigModify 
            label="Max post age to allow commenting"
            numberType="time_ms"
            numberToConfigFunc={(num)=>{return {setMaxPostAgeToComment: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.maxPostAgeToComment}
        />

        <h2>Miscelanious</h2>
        <ServerNumberConfigModify 
            label="Min wait to change username"
            numberType="time_ms"
            numberToConfigFunc={(num)=>{return {setMinWaitToChangeUsername: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.minWaitToChangeUsername}
        />

        <hr/>

        <ServerNumberConfigModify 
            label="Max moderation log age to save"
            numberType="time_ms"
            numberToConfigFunc={(num)=>{return {setMaxModerationLogAgeToSave: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.maxModerationLogAgeToSave}
        />
    
        <hr/>

        <ServerNumberConfigModify 
            label="Max JWT age"
            numberType="time_ms"
            numberToConfigFunc={(num)=>{return {setMaxJwtAge: num}}}
            refreshCallback={loadServerConfig}
            currentValue={serverConfig.config.limits.maxJwtAge}
        />
    </div>
{/if}

<style>
    .container{
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    hr{
        border-width: 1px;
    }
</style>
