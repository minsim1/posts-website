<script lang="ts">
	import type { Snippet } from "svelte";
	import QuestionIcon from "../icons/QuestionIcon.svelte";
	import Modal from "../Modal.svelte";

	let {
		title = "Help",
		children
	}: {
		title?: string;
		children: Snippet;
	} = $props();

	let isOpen = $state(false);

	function openModal() {
		isOpen = true;
	}
</script>

<button class="help-button" onclick={openModal} type="button" aria-label="Help">
	<QuestionIcon />
</button>

<Modal bind:isOpen {title}>
	{@render children()}
</Modal>

<style>
	.help-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		border: none;
		background: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: color 0.2s;
		vertical-align: middle;
	}

	.help-button:hover {
		color: var(--color-primary);
	}

	.help-button :global(svg) {
		width: 20px;
		height: 20px;
	}
</style>
