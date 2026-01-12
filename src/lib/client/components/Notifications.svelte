<script lang="ts">
	import { notificationStore, type Notification } from "$lib/client/stores/notifications";
	import CloseIcon from "./icons/CloseIcon.svelte";

	let notifications = $state<Notification[]>([]);

	notificationStore.subscribe(value => {
		notifications = value;
	});

	function handleClose(id: string) {
		notificationStore.remove(id);
	}
</script>

<div class="notifications-container">
	{#each notifications as notification (notification.id)}
		<div class="notification notification-{notification.type}">
			<div class="notification-content">
				<p class="notification-message">{notification.message}</p>
			</div>
			<button 
				class="close-button" 
				onclick={() => handleClose(notification.id)}
				aria-label="Close notification"
			>
				<CloseIcon />
			</button>
		</div>
	{/each}
</div>

<style>
	.notifications-container {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		z-index: 9999;
		max-width: 400px;
	}

	.notification {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 4px;
		box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.06);
		background-color: var(--color-bg-light);
		border-left: 4px solid;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.notification-error {
		border-left-color: var(--color-danger);
	}

	.notification-success {
		border-left-color: var(--color-success);
	}

	.notification-info {
		border-left-color: var(--color-primary);
	}

	.notification-warning {
		border-left-color: var(--color-warning);
	}

	.notification-content {
		flex: 1;
	}

	.notification-message {
		margin: 0;
		color: var(--color-text);
		font-size: 0.95rem;
		line-height: 1.4;
		word-wrap: break-word;
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
		transition: color 0.2s;
		flex-shrink: 0;
	}

	.close-button:hover {
		color: var(--color-text);
	}

	.close-button :global(svg) {
		width: 100%;
		height: 100%;
	}
</style>
