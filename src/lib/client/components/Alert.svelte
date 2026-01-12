<script lang="ts">
	export let message: string;
	export let type: 'error' | 'success' | 'info' = 'error';
</script>

{#if message}
	<div class="alert alert-{type}">
		{#each message.split('\n') as line, index}
			{line} {#if index < message.split('\n').length - 1}<br>{/if}
		{/each}
	</div>
{/if}

<style>
	.alert {
		padding: 0.75rem;
		margin-bottom: 1rem;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.alert-error {
		background: var(--color-error-bg);
		color: var(--color-error-text);
	}

	.alert-success {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.alert-info {
		background: var(--color-bg-light);
	}
</style>
