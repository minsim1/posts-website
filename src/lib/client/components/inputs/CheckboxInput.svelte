<script lang='ts'>
	import type { Snippet } from 'svelte';

    let {
        id,
        labelSlot,
        checked = $bindable(false),
        required
    } : {
        id: string;
        labelSlot: Snippet;
        checked: boolean;
        required?: boolean;
    } = $props();
</script>

<div class="checkbox-input">
    <input type="checkbox" id={id} required={required} bind:checked={checked}/>
    <label for={id}>
        {@render labelSlot()}
    </label>
</div>

<style>
    .checkbox-input {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    input{
        width: 1.5rem;
        height: 1.5rem;
    }
</style>
