<script lang='ts'>
    import { API } from "$lib/api/api";
    import type { AdminAPITypes } from "$lib/api/types";
    import { STRINGS } from "$lib/client/strings/main";
    import { onMount } from "svelte";
    import LoadingIcon from "../../icons/LoadingIcon.svelte";
    import Alert from "../../Alert.svelte";
    import Button from "../../inputs/Button.svelte";

    let loading = $state(false);

    let queryRes = $state<AdminAPITypes.RecordsQueryRes | null>(null);
    let queryError = $state('');

    let expungeRes = $state<AdminAPITypes.RecordsDeletionRes | null>(null);
    let expungeError = $state('');

    async function queryRecords(){
        queryRes = null;
        queryError = '';

        loading = true;
        const response = await API.admin.records.query();
        loading = false;

        if(response.success){
            queryRes = response.data.queryResult;
        }else{
            if(response.error){
                queryError = STRINGS.errors[response.error.code];
            }else{
                queryError = STRINGS.generic.unknownError + ` (${response.status})`;
            }
        }
    }

    async function handleExpunge(){
        expungeRes = null;
        expungeError = '';

        loading = true;
        const response = await API.admin.records.expungeOld();
        loading = false;

        if(response.success){
            expungeRes = response.data.expungeResult;
        }else{
            if(response.error){
                expungeError = STRINGS.errors[response.error.code];
            }else{
                expungeError = STRINGS.generic.unknownError + ` (${response.status})`;
            }
        }
    }

    onMount(()=>{
        queryRecords();
    })
</script>

{#if loading}
    <div class="loading-container">
        <LoadingIcon size={48} />
    </div>
{:else}
    {@render querySection()}
    <hr/>
    {@render expungeSection()}
{/if}

{#snippet querySection()}
    <Button variant="secondary" on:click={queryRecords}>Reload</Button>
    {#if queryError || !queryRes}
        <Alert type="error" message={queryError ?? "Unknown error"} />
    {:else}
        {@render queryResult(queryRes)}
    {/if}
{/snippet}

{#snippet queryResult(queryRes: AdminAPITypes.RecordsQueryRes)}
    <div>
        <h2>Records Query Result</h2>
        <p>Number of anonymous posts with non-expunged author IDs: {queryRes.numOfAnonPostsWithNonExpungedAuthorIDs}</p>
        <p>Number of anonymous comments with non-expunged author IDs: {queryRes.numOfAnonCommentsWithNonExpungedAuthorIDs}</p>
        <p>Number of mod logs to be deleted: {queryRes.numOfModLogsToBeDeleted}</p>
    </div>
{/snippet}

{#snippet expungeSection()}
    <Button variant="danger" on:click={handleExpunge}>Expunge Old Records</Button>
    {#if expungeError || !expungeRes}
        <Alert type="error" message={expungeError ?? "Unknown error"} />
    {:else}
        {@render expungeResult(expungeRes)}
    {/if}
{/snippet}

{#snippet expungeResult(expungeRes: AdminAPITypes.RecordsDeletionRes)}
    <div>
        <h2>Records Expunge Result</h2>
        <p>Number of users affected by moderation log deletion: {expungeRes.numOfUsersAffectedByModLogDeletion}</p>
        <p>Number of expunged author IDs in anonymous comments: {expungeRes.numOfExpungedAuthorIdsInAnonComments}</p>
        <p>Number of expunged author IDs in anonymous posts: {expungeRes.numOfExpungedAuthorIdsInAnonPosts}</p>
    </div>
{/snippet}

<style>
    .loading-container{
        display: flex;
        justify-content: center;
        align-items: center;
    }

    hr{
        margin: 2rem 0;
        border: 1px solid var(--color-border-light);
        width: 100%;
    }
</style>
