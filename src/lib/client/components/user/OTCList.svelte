<script lang='ts'>
    import { API } from "$lib/api/api";
    import type { SanitizedOTC } from "$lib/api/types";
    import { STRINGS } from "$lib/client/strings/main";
    import { LogOut } from "$lib/helpers/logout";
    import { onMount } from "svelte";
    import Alert from "../Alert.svelte";
    import LoadingIcon from "../icons/LoadingIcon.svelte";
    import OTC from "./OTC.svelte";

    let otcs = $state<SanitizedOTC[]>([]);

    let loading = $state(false);
    let error = $state('');

    async function loadOTCs(){
        error = "";

        loading = true;
        const response = await API.user.getOTCs();
        loading = false;

        if(response.success){
            otcs = response.data.otcs;
            return;
        }

        if(response.status == 401 || response.status == 403){
            await LogOut();
            return;
        }

        if(!response.error){
            error = STRINGS.generic.unknownError + ` (${response.status})`;
            return;
        }else{
            error = STRINGS.errors[response.error.code];
            return;
        }
    }

    onMount(async () => {
        await loadOTCs();
    });
</script>

<h2>One-Time registration codes</h2>
{#if loading}
    <LoadingIcon size={48}/>
{:else if error !== ''}
    <Alert type="error" message={error} />
{:else if otcs.length === 0}
    <p>You have no one-time codes available.</p>
{:else}
    <ul class="otc-list">
        {#each otcs as otc}
            <OTC code={otc.code} expiresAtTimestamp={otc.expiresAtTimestamp} />
        {/each}
    </ul>
{/if}

<style>
    .otc-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
</style>