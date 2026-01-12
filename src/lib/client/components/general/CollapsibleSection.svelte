<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		title,
		count,
		children,
		defaultOpen = false
	}: {
		title: string;
		count: number;
		children: Snippet;
		defaultOpen?: boolean;
	} = $props();

	// svelte-ignore state_referenced_locally
		let isOpen = $state(defaultOpen);

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<section class="collapsible-section">
	<button class="section-header" onclick={toggle} type="button">
		<h2>{title} ({count})</h2>
		<span class="toggle-icon" class:open={isOpen}>
			{isOpen ? '▼' : '▶'}
		</span>
	</button>
	{#if isOpen}
		<div class="section-content">
			{@render children()}
		</div>
	{/if}
</section>

<style>
	.collapsible-section {
		background-color: var(--color-bg-secondary);
		border-radius: 8px;
		overflow: hidden;
        gap: 1rem;
        display: flex;
        flex-direction: column;
	}

	.section-header {
		width: 100%;
		padding: 1.5rem;
		background: none;
		border: none;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.section-header:hover {
		background-color: var(--color-bg-main);
	}

	h2 {
		margin: 0;
		color: var(--color-text);
		font-size: 1.25rem;
		text-align: left;
	}

	.toggle-icon {
		color: var(--color-text-secondary);
		font-size: 1rem;
		transition: transform 0.2s;
	}

	.toggle-icon.open {
		transform: rotate(0deg);
	}

	.section-content {
		padding: 0 1.5rem 1.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
