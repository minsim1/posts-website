<script lang='ts'>
	import Modal from "../Modal.svelte";
	import Button from "../inputs/Button.svelte";

	let {
		isOpen = $bindable(false),
		contentType,
		deleteContentCallback,
		showLoading = false
	}: {
		isOpen: boolean;
		contentType: 'post' | 'comment';
		deleteContentCallback: () => void;
		showLoading?: boolean;
	} = $props();

	function handleConfirm() {
		deleteContentCallback();
	}
</script>

<Modal bind:isOpen title={`Delete ${contentType === 'post' ? 'Post' : 'Comment'}`}>
	{#snippet children()}
		<div class="modal-content-wrapper">
			<div class="warning-section">
				<p class="warning-text">
					Are you sure you want to delete this {contentType}? This action is irreversible.
				</p>
				{#if contentType === 'post'}
					<p class="warning-text additional-warning">
						All votes and comments associated with this post will also be deleted.
					</p>
				{/if}
			</div>

			<div class="button-group">
				<Button 
					type="button" 
					variant="secondary" 
					disabled={showLoading}
					on:click={() => isOpen = false}
				>
					Cancel
				</Button>
				<Button 
					type="button" 
					variant="danger" 
					showLoading={showLoading}
					on:click={handleConfirm}
				>
					Delete
				</Button>
			</div>
		</div>
	{/snippet}
</Modal>

<style>
	.modal-content-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.warning-section {
		background-color: var(--color-bg-secondary);
		padding: 1rem;
		border-radius: 4px;
		/* border-left: 4px solid var(--color-danger); */
	}

	.warning-text {
		margin: 0;
		color: var(--color-text);
		font-size: 1rem;
		line-height: 1.5;
	}

	.additional-warning {
		margin-top: 0.75rem;
		font-weight: 600;
	}

	.button-group {
		display: flex;
		gap: 1rem;
	}

	.button-group :global(.btn) {
		flex: 1;
	}
</style>
