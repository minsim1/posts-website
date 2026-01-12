<script lang='ts'>
    import { API } from "$lib/api/api";
    import type { APITypes } from "$lib/api/types";
    import { STRINGS } from "$lib/client/strings/main";
    import Alert from "../../Alert.svelte";
    import Button from "../../inputs/Button.svelte";
    import TextInput from "../../inputs/TextInput.svelte";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import TrashIcon from "../../icons/TrashIcon.svelte";

    export let label: string;
    export let currentValues: string[];
    export let addStringToConfigFunc: (value: string) => APITypes.Admin.ModifyConfig.Request;
    export let removeStringFromConfigFunc: (value: string) => APITypes.Admin.ModifyConfig.Request;
    export let refreshCallback: ()=>void;

    let newValue: string = "";
    let loading = false;
    let error = "";
    let success = "";

    async function addString(){
        if(loading) return;

        error = "";
        success = "";

        if(newValue.trim() === ""){
            error = "Please enter a value";
            return;
        }

        if(currentValues.includes(newValue.trim())){
            error = "This value already exists";
            return;
        }

        const requestData = addStringToConfigFunc(newValue.trim());

        loading = true;
        const response = await API.admin.changeConfig(requestData);
        loading = false;

        if(response.success == true){
            success = "Successfully added value";
            LocalStorageHelper.ClearServerConfigCache();
            newValue = "";
            refreshCallback();
            return;
        }else{
            if(response.status == 401 || response.status == 403){
                window.location.href = "/login";
                return;
            }

            if(response.error){
                error = STRINGS.errors[response.error.code];
                return;
            }else{
                error = STRINGS.generic.unknownError + ` (${response.status})`;
            }
        }
    }

    async function removeString(value: string){
        if(loading) return;

        error = "";
        success = "";

        const requestData = removeStringFromConfigFunc(value);

        loading = true;
        const response = await API.admin.changeConfig(requestData);
        loading = false;

        if(response.success == true){
            success = "Successfully removed value";
            LocalStorageHelper.ClearServerConfigCache();
            refreshCallback();
            return;
        }else{
            if(response.status == 401 || response.status == 403){
                window.location.href = "/login";
                return;
            }

            if(response.error){
                error = STRINGS.errors[response.error.code];
                return;
            }else{
                error = STRINGS.generic.unknownError + ` (${response.status})`;
            }
        }
    }
</script>

<h3>{label}</h3>

<div class="list-container">
    {#if currentValues.length === 0}
        <p class="empty-message">No values configured</p>
    {:else}
        <ul class="values-list">
            {#each currentValues as value}
                <li>
                    <span class="value-text">{value}</span>
                    <button 
                        class="remove-button" 
                        onclick={() => removeString(value)}
                        disabled={loading}
                        aria-label="Remove value"
                    >
                        <TrashIcon />
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<form onsubmit={(e) => { e.preventDefault(); addString(); }}>
    <div class="text-input">
        <TextInput
            label="Add new value"
            bind:value={newValue}
            type="text"
            id="new-value"
        />
    </div>
    <div class="submit-button">
        <Button type="submit" disabled={loading}>
            Add
        </Button>
    </div>
</form>

{#if error}
    <Alert
        message={error}
        type="error"
    />
{/if}

{#if success}
    <Alert
        message={success}
        type="success"
    />
{/if}

<style>
    form{
        display: flex;
        flex-direction: row;
        gap: 5px;
        align-items: flex-end;
        margin-top: 1rem;
    }

    .text-input{
        flex: 3;
    }

    .submit-button{
        flex: 1;
    }

    .list-container {
        margin: 1rem 0;
    }

    .empty-message {
        color: var(--color-text-secondary);
        font-style: italic;
        margin: 0.5rem 0;
    }

    .values-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .values-list li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background-color: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: 4px;
        max-width: 500px;
    }

    .value-text {
        color: var(--color-text);
        flex: 1;
        max-width: 100%;
        word-break: break-all;
    }

    .remove-button {
        background: none;
        border: none;
        color: var(--color-text-muted);
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
    }

    .remove-button:hover:not(:disabled) {
        color: var(--color-error);
    }

    .remove-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .remove-button :global(svg) {
        width: 18px;
        height: 18px;
    }
</style>
