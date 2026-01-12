<script lang="ts">
    import type { Snippet } from "svelte";

	let {
		id,
		label,
		type = 'text',
		value = $bindable(''),
		required = false,
		disabled = false,
		placeholder = '',
		helpButton
	}: {
		id: string;
		label: string;
		type?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
		helpButton?: Snippet;
	} = $props();
</script>

<div class="form-group">
	<label for={id}>{label} {#if helpButton}{@render helpButton()}{/if}</label>
	<input
		{id}
		{type}
		{required}
		{disabled}
		{placeholder}
		bind:value
	/>
</div>

<style>
	label {
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-bg-input);
		color: white;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	input:disabled {
		background-color: var(--color-bg-disabled);
		cursor: not-allowed;
	}

	input:-webkit-autofill,
	input:-webkit-autofill:hover,
	input:-webkit-autofill:focus,
	input:-webkit-autofill:active {
		-webkit-box-shadow: 0 0 0 30px var(--color-bg-input) inset !important;
		-webkit-text-fill-color: white !important;
	}
</style>
