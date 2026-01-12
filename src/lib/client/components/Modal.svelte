<script lang='ts'>
	import { onMount } from 'svelte';
	import CloseIcon from './icons/CloseIcon.svelte';

	let {
		isOpen = $bindable(false),
		title = '',
		onClose = () => {},
		children
	}: {
		isOpen: boolean;
		title?: string;
		onClose?: () => void;
		children?: any;
	} = $props();

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			close();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}

	function close() {
		isOpen = false;
		onClose();
	}

	onMount(() => {
		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown);
			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}
	});

	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	});
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="modal-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true" tabindex="-1">
		<div class="modal-content">
			{#if title}
				<div class="modal-header">
					<h2>{title}</h2>
					<button class="close-button" onclick={close} aria-label="Close modal">
						<CloseIcon />
					</button>
				</div>
			{/if}
			<div class="modal-body">
				{@render children?.()}
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
		padding: 1rem;
	}

	.modal-content {
		background-color: var(--color-bg-main);
		border-radius: 12px;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
		transition: color 0.2s;
	}

	.close-button:hover {
		color: var(--color-text);
	}

	.close-button :global(svg) {
		width: 24px;
		height: 24px;
	}

	.modal-body {
		padding: 1.5rem;
	}
</style>
