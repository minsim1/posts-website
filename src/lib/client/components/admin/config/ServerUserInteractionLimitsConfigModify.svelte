<script lang='ts'>
    import { API } from "$lib/api/api";
    import type { APITypes } from "$lib/api/types";
    import type { UserInteractionLimit, UserInteractionType } from "$lib/server/db/types";
    import { STRINGS } from "$lib/client/strings/main";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import Alert from "../../Alert.svelte";
    import Button from "../../inputs/Button.svelte";
    import TextInput from "../../inputs/TextInput.svelte";
    import TimeInput from "../../inputs/TimeInput.svelte";
    import UserInteractionLimitItem from "./UserInteractionLimitItem.svelte";

    let {
        currentLimits,
        refreshCallback
    }: {
        currentLimits: UserInteractionLimit[];
        refreshCallback: () => void;
    } = $props();

    let newTimeframeMs = $state(0);
    let newMaxInteractionsStr = $state("");
    let newInteractionTypes = $state<{[key in UserInteractionType]: boolean}>({
        post: false,
        comment: false,
        vote: false
    });

    let loading = $state(false);
    let error = $state("");
    let success = $state("");

    function getSelectedInteractionTypes(typeObj: {[key in UserInteractionType]: boolean}): UserInteractionType[] {
        return (Object.keys(typeObj) as UserInteractionType[]).filter(key => typeObj[key]);
    }

    function createAddLimitRequest(timeframe: number, maxInteractions: number, interactionTypes: UserInteractionType[]): APITypes.Admin.ModifyConfig.Request {
        return {
            newUserInteractionLimits: [{
                timeframe,
                maxInteractions,
                interactionTypes,
                limitId: "",
            }]
        };
    }

    function createRemoveLimitRequest(limitId: string): APITypes.Admin.ModifyConfig.Request {
        return {
            removeUserInteractionLimits: [limitId]
        };
    }

    function createModifyLimitRequest(limitId: string, timeframe: number, maxInteractions: number, interactionTypes: UserInteractionType[]): APITypes.Admin.ModifyConfig.Request {
        return {
            modifyUserInteractionLimits: [{
                limitId,
                newLimit: {
                    timeframe,
                    maxInteractions,
                    interactionTypes,
                    limitId: "",
                }
            }]
        };
    }

    async function handleAddLimit() {
        if(loading) return;

        error = "";
        success = "";

        const maxInteractions = parseInt(newMaxInteractionsStr);

        if(newTimeframeMs <= 0) {
            error = "Please enter a valid timeframe";
            return;
        }

        if(isNaN(maxInteractions) || maxInteractions <= 0) {
            error = "Please enter a valid positive max interactions";
            return;
        }

        const selectedTypes = getSelectedInteractionTypes(newInteractionTypes);
        if(selectedTypes.length === 0) {
            error = "Please select at least one interaction type";
            return;
        }

        const requestData = createAddLimitRequest(newTimeframeMs, maxInteractions, selectedTypes);

        loading = true;
        const response = await API.admin.changeConfig(requestData);
        loading = false;

        if(response.success) {
            success = "Successfully added limit";
            LocalStorageHelper.ClearServerConfigCache();
            newTimeframeMs = 0;
            newMaxInteractionsStr = "";
            newInteractionTypes = {post: false, comment: false, vote: false};
            refreshCallback();
        } else {
            if(response.status == 401 || response.status == 403) {
                window.location.href = "/login";
                return;
            }

            if(response.error) {
                error = STRINGS.errors[response.error.code];
            } else {
                error = STRINGS.generic.unknownError + ` (${response.status})`;
            }
        }
    }

    async function handleSaveLimit(limitId: string, timeframe: number, maxInteractions: number, interactionTypes: UserInteractionType[]) {
        if(loading) return;

        error = "";
        success = "";

        const requestData = createModifyLimitRequest(limitId, timeframe, maxInteractions, interactionTypes);

        loading = true;
        const response = await API.admin.changeConfig(requestData);
        loading = false;

        if(response.success) {
            success = "Successfully updated limit";
            LocalStorageHelper.ClearServerConfigCache();
            refreshCallback();
        } else {
            if(response.status == 401 || response.status == 403) {
                window.location.href = "/login";
                return;
            }

            if(response.error) {
                error = STRINGS.errors[response.error.code];
            } else {
                error = STRINGS.generic.unknownError + ` (${response.status})`;
            }
        }
    }

    async function handleRemoveLimit(limitId: string) {
        if(loading) return;

        error = "";
        success = "";

        const requestData = createRemoveLimitRequest(limitId);

        loading = true;
        const response = await API.admin.changeConfig(requestData);
        loading = false;

        if(response.success) {
            success = "Successfully removed limit";
            LocalStorageHelper.ClearServerConfigCache();
            refreshCallback();
        } else {
            if(response.status == 401 || response.status == 403) {
                window.location.href = "/login";
                return;
            }

            if(response.error) {
                error = STRINGS.errors[response.error.code];
            } else {
                error = STRINGS.generic.unknownError + ` (${response.status})`;
            }
        }
    }
</script>

<h3>User Interaction Limits</h3>
<div class="limits-list">
    {#if currentLimits.length === 0}
        <p class="empty-message">No limits configured</p>
    {:else}
        {#each currentLimits as limit (limit.limitId)}
            <UserInteractionLimitItem
                {limit}
                onSave={(timeframe, maxInteractions, interactionTypes) => handleSaveLimit(limit.limitId, timeframe, maxInteractions, interactionTypes)}
                onRemove={handleRemoveLimit}
                {loading}
            />
        {/each}
    {/if}
</div>

<div class="add-section">
    <h4>Add New Limit</h4>
    <form onsubmit={(e) => { e.preventDefault(); handleAddLimit(); }}>
        <div class="form-row">
            <div class="form-field">
                <TimeInput
                    label="Timeframe"
                    bind:value={newTimeframeMs}
                    id="new-timeframe"
                />
            </div>
            <div class="form-field">
                <TextInput
                    label="Max Interactions"
                    bind:value={newMaxInteractionsStr}
                    type="number"
                    id="new-max"
                />
            </div>
        </div>
        <div class="form-row">
            <div class="checkbox-group-label">Interaction Types:</div>
            <div class="checkbox-group">
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={newInteractionTypes.post} />
                    Post
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={newInteractionTypes.comment} />
                    Comment
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={newInteractionTypes.vote} />
                    Vote
                </label>
            </div>
        </div>
        <Button type="submit" disabled={loading}>
            Add Limit
        </Button>
    </form>
</div>

{#if error}
    <Alert message={error} type="error" />
{/if}

{#if success}
    <Alert message={success} type="success" />
{/if}

<style>
    h4 {
        margin-top: 0;
        margin-bottom: 1rem;
    }

    .limits-list {
        margin: 1rem 0;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .empty-message {
        color: var(--color-text-secondary);
        font-style: italic;
        margin: 0.5rem 0;
    }

    .add-section {
        margin-top: 2rem;
        padding: 1rem;
        background-color: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: 4px;
    }

    .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        align-items: flex-end;
    }

    .form-field {
        flex: 1;
    }

    .checkbox-group-label {
        font-weight: 600;
        margin-bottom: 0.5rem;
        display: block;
        color: var(--color-text);
    }

    .checkbox-group {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        color: var(--color-text);
    }

    .checkbox-label input[type="checkbox"] {
        cursor: pointer;
    }

    @media (max-width: 768px) {
        .form-row {
            flex-direction: column;
            align-items: stretch;
        }
    }
</style>