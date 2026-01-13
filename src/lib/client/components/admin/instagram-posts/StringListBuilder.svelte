<script lang='ts'>
    import Button from "../../inputs/Button.svelte";
    import TextInput from "../../inputs/TextInput.svelte";
    import TrashIcon from "../../icons/TrashIcon.svelte";

    let {
        list = $bindable<string[]>([]),
    } : {
        list: string[];
    } = $props();

    let newValue = $state("");

    async function addString(){
        list.push(newValue.trim());
        newValue = "";
    }

    async function removeString(index: number){
        list.splice(index, 1);
    }
</script>

<div class="list-container">
    {#if list.length === 0}
        <p class="empty-message">No values configured</p>
    {:else}
        <ul class="values-list">
            {#each list as value, index}
                <li>
                    <span class="value-text">{value}</span>
                    <button 
                        class="remove-button" 
                        onclick={() => removeString(index)}
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
        <Button type="submit">
            Add
        </Button>
    </div>
</form>

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
