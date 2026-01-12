<script lang='ts'>
    import type { UserInteractionLimit, UserInteractionType } from "$lib/server/db/types";
    import { GetExactTimeDifferenceString } from "$lib/client/helpers/time";
    import Button from "../../inputs/Button.svelte";
    import TextInput from "../../inputs/TextInput.svelte";
    import TimeInput from "../../inputs/TimeInput.svelte";
    import TrashIcon from "../../icons/TrashIcon.svelte";

    let {
        limit,
        onSave,
        onRemove,
        loading = false
    }: {
        limit: UserInteractionLimit;
        onSave: (timeframe: number, maxInteractions: number, interactionTypes: UserInteractionType[]) => Promise<void>;
        onRemove: (limitId: string) => Promise<void>;
        loading?: boolean;
    } = $props();

    let isEditing = $state(false);
    let timeframeMs = $derived<number>(limit.timeframe);
    let maxInteractionsStr = $derived<string>(limit.maxInteractions.toString());
    let interactionTypes = $derived<{[key in UserInteractionType]: boolean}>({
        post: limit.interactionTypes.includes('post'),
        comment: limit.interactionTypes.includes('comment'),
        vote: limit.interactionTypes.includes('vote')
    });

    function startEdit() {
        isEditing = true;
        timeframeMs = limit.timeframe;
        maxInteractionsStr = limit.maxInteractions.toString();
        interactionTypes = {
            post: limit.interactionTypes.includes('post'),
            comment: limit.interactionTypes.includes('comment'),
            vote: limit.interactionTypes.includes('vote')
        };
    }

    function cancelEdit() {
        isEditing = false;
    }

    function getSelectedTypes(): UserInteractionType[] {
        return (Object.keys(interactionTypes) as UserInteractionType[]).filter(key => interactionTypes[key]);
    }

    async function handleSave() {
        const maxInteractions = parseInt(maxInteractionsStr);
        if(isNaN(maxInteractions) || maxInteractions <= 0) return;

        const selectedTypes = getSelectedTypes();
        if(selectedTypes.length === 0) return;

        await onSave(timeframeMs, maxInteractions, selectedTypes);
        isEditing = false;
    }

    function formatInteractionTypes(types: UserInteractionType[]): string {
        return types.join(', ');
    }
</script>

<div class="limit-card">
    {#if isEditing}
        <div class="edit-form">
            <div class="form-row">
                <div class="form-field">
                    <TimeInput
                        label="Timeframe"
                        bind:value={timeframeMs}
                        id={`edit-timeframe-${limit.limitId}`}
                    />
                </div>
                <div class="form-field">
                    <TextInput
                        label="Max Interactions"
                        bind:value={maxInteractionsStr}
                        type="number"
                        id={`edit-max-${limit.limitId}`}
                    />
                </div>
            </div>
            <fieldset class="form-row checkbox-fieldset">
                <legend class="checkbox-group-label">Interaction Types:</legend>
                <div class="checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" bind:checked={interactionTypes.post} />
                        Post
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" bind:checked={interactionTypes.comment} />
                        Comment
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" bind:checked={interactionTypes.vote} />
                        Vote
                    </label>
                </div>
            </fieldset>
            <div class="edit-actions">
                <Button on:click={handleSave} disabled={loading}>Save</Button>
                <Button on:click={cancelEdit} disabled={loading} variant="secondary">Cancel</Button>
            </div>
        </div>
    {:else}
        <div class="limit-info">
            <div class="limit-details">
                <p><strong>Timeframe:</strong> {GetExactTimeDifferenceString(limit.timeframe, 0)}</p>
                <p><strong>Max Interactions:</strong> {limit.maxInteractions}</p>
                <p><strong>Types:</strong> {formatInteractionTypes(limit.interactionTypes)}</p>
            </div>
            <div class="limit-actions">
                <Button on:click={startEdit} disabled={loading} variant="secondary">
                    Edit
                </Button>
                <button 
                    class="remove-button" 
                    onclick={() => onRemove(limit.limitId)}
                    disabled={loading}
                    aria-label="Remove limit"
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .limit-card {
        background-color: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: 4px;
        padding: 1rem;
    }

    .limit-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    .limit-details {
        flex: 1;
    }

    .limit-details p {
        margin: 0.5rem 0;
        color: var(--color-text);
    }

    .limit-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
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

    .edit-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-row {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
        flex-wrap: wrap;
    }

    .checkbox-fieldset {
        border: none;
        padding: 0;
        margin: 0;
        flex-direction: column;
        align-items: flex-start;
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

    .edit-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    @media (max-width: 768px) {
        .limit-info {
            flex-direction: column;
            align-items: flex-start;
        }

        .limit-actions {
            width: 100%;
            justify-content: flex-end;
        }

        .form-row {
            flex-direction: column;
            align-items: stretch;
        }
    }
</style>
