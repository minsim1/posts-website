<script lang="ts">
	import LoadingIcon from "../icons/LoadingIcon.svelte";

	let className: string = "";
	export { className as class };
	export let type: 'submit' | 'button' = 'submit';
	export let disabled: boolean = false;
	export let variant: 'primary' | 'secondary' | 'danger' | 'outline' = 'primary';
	export let fullWidth: boolean = true;
	export let selected: boolean = false;
	export let showLoading: boolean = false;
</script>

<button 
	{type} 
	disabled={disabled || showLoading}
	class="btn btn-{variant} {className}"
	class:full-width={fullWidth}
	class:selected
	on:click
>
	<span class="button-content">
		<slot />
		{#if showLoading}
			<span class="loading-icon">
				<LoadingIcon />
			</span>
		{/if}
	</span>
</button>

<style>
	.btn {
		padding: 0.75rem 1rem;
		border: 2px solid transparent;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.button-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.loading-icon {
		width: 1em;
		height: 1em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.full-width {
		width: 100%;
	}

	.btn-primary {
		background: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: var(--color-bg-main);
		color: var(--color-text);
		border-color: var(--color-primary);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--color-primary);
		color: var(--color-white);
		transform: translateY(-1px);
	}

	.btn-danger {
		background: var(--color-error-text);
		color: var(--color-white);
	}

	.btn-danger:hover:not(:disabled) {
		background: var(--color-error);
		transform: translateY(-1px);
	}

	.btn-outline {
		background: var(--color-bg-main);
		color: var(--color-text);
		border-color: var(--color-border);
	}

	.btn-outline:hover:not(:disabled) {
		border-color: var(--color-primary);
	}

	.btn-outline.selected {
		border-color: var(--color-primary);
		/* color: var(--color-primary); */
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
