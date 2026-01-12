<script lang="ts">
	import Button from "../inputs/Button.svelte";

	let {
		isOpen = $bindable(false),
		title,
		message,
		confirmText = "Confirm",
		cancelText = "Cancel",
		onConfirm,
		onCancel,
		dangerous = false,
		showLoading = false
	}: {
		isOpen?: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		onConfirm: () => void;
		onCancel?: () => void;
		dangerous?: boolean;
		showLoading?: boolean;
	} = $props();

	function handleConfirm() {
		onConfirm();
		isOpen = false;
	}

	function handleCancel() {
		if (onCancel) onCancel();
		isOpen = false;
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if isOpen}
	<div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
		<div class="modal-content" class:dangerous>
			<h2>{title}</h2>
			<p>{message}</p>
			<div class="modal-actions">
				<Button on:click={handleCancel}>{cancelText}</Button>
				<Button on:click={handleConfirm} variant={dangerous ? "danger" : "primary"} showLoading={showLoading}>
					{confirmText}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background-color: var(--color-bg-main);
		padding: 2rem;
		border-radius: 8px;
		max-width: 500px;
		width: 90%;
	}

	.modal-content.dangerous {
		border: 2px solid var(--color-error);
	}

	h2 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
		font-size: 1.5rem;
	}

	p {
		margin: 0 0 1.5rem 0;
		color: var(--color-text);
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	:global(.modal-actions .primary) {
		background-color: var(--color-primary);
		color: white;
	}

	:global(.modal-actions .primary:hover) {
		background-color: var(--color-primary-hover);
	}
</style>
