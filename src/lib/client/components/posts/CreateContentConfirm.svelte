<script lang='ts'>
	import type { SanitizedConfig } from "$lib/api/types";
	import LocalStorageHelper from "$lib/client/helpers/local-storage";
	import Modal from "../Modal.svelte";
	import Button from "../inputs/Button.svelte";
	import { onMount } from "svelte";

	let {
		isOpen = $bindable(false),
		contentType,
		createContentCallback,
		showLoading = false
	}: {
		isOpen: boolean;
		contentType: 'post' | 'comment';
		createContentCallback: (anonymous: boolean) => void;
		showLoading?: boolean;
	} = $props();

	let isAnonymous = $state(true);
	let serverConfig = $state<SanitizedConfig | null>(null);

	async function loadConfig() {
		serverConfig = await LocalStorageHelper.GetServerConfigData();
	}

	function handleConfirm() {
		createContentCallback(isAnonymous);
	}

	$effect(() => {
		if (!isOpen) {
			isAnonymous = true;
		}
	});

	onMount(() => {
		loadConfig();
	});
</script>

<Modal bind:isOpen title={`Confirm ${contentType === 'post' ? 'Post' : 'Comment'}`}>
	{#snippet children()}
		<div class="modal-content-wrapper">
			{#if serverConfig && serverConfig.postingRules.length > 0}
				<div class="rules-section">
					<h3>{contentType === 'post' ? 'Posting' : 'Commenting'} Rules</h3>
					<ul>
						{#each serverConfig.postingRules as rule}
							<li>{rule}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="anonymity-options">
				<h3>{contentType === 'post' ? 'Post' : 'Comment'} Visibility</h3>
				<div class="option-buttons">
					<Button 
						type="button"
						variant="outline"
						selected={isAnonymous}
						fullWidth={false}
						disabled={showLoading}
						on:click={() => isAnonymous = true}
					>
						Anonymous
					</Button>
					<Button 
						type="button"
						variant="outline"
						selected={!isAnonymous}
						fullWidth={false}
						disabled={showLoading}
						on:click={() => isAnonymous = false}
					>
						Not Anonymous
					</Button>
				</div>
				<p class="anonymous-warning">
					Anonymous {contentType === 'post' ? 'posters' : 'commenters'} are not exempt from suspensions
				</p>
			</div>

			<Button type="button" variant="primary" showLoading={showLoading} on:click={handleConfirm}>
				{contentType === 'post' ? 'Post' : 'Comment'}
			</Button>
		</div>
	{/snippet}
</Modal>

<style>
	.modal-content-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.rules-section {
		background-color: var(--color-bg-secondary);
	}

	.rules-section h3 {
		margin: 0 0 0.75rem 0;
		color: var(--color-text);
		font-size: 1.1rem;
	}

	.rules-section ul {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--color-text);
	}

	.rules-section li {
		margin-bottom: 0.5rem;
	}

	.anonymity-options h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
		font-size: 1.1rem;
	}

	.option-buttons {
		display: flex;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.option-buttons :global(.btn) {
		flex: 1;
	}

	.anonymous-warning {
		font-size: 0.9rem;
		padding-top: 0.5rem;
		text-align: center;
		color: var(--color-text-secondary);
		margin: 0;
	}
</style>
