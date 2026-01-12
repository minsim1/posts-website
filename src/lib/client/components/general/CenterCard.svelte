<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		children,
		class: className = ""
	}: {
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div class="page-center">
	<div class="center-card {className}">
		{@render children()}
	</div>
</div>

<style>
	.page-center {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
        margin-top: 1rem;
        margin-bottom: 1rem;
		flex: 1;
	}

	.center-card {
		max-width: 800px;
		width: 100%;
		padding: 1rem;
		background-color: var(--color-bg-light);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
