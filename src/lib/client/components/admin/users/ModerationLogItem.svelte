<script lang="ts">
    import { GetDateTimeString, GetExactTimeDifferenceString } from "$lib/client/helpers/time";
	import DynamicTimeText from "../../general/DynamicTimeText.svelte";
    import RedirectToOtherUser from "./RedirectToOtherUser.svelte";

	let {
		action,
		timestamp,
		targetUserId,
		reason,
		content,
		suspensionDuration,
		suspensionApplied,
		attemptedToApplySuspension
	}: {
		action: string;
		timestamp: number;
		targetUserId: string | null;
		reason: string | null;
		content: string | null;
		suspensionDuration: number | null;
		suspensionApplied: boolean;
		attemptedToApplySuspension: boolean;
	} = $props();
</script>

<div class="log-item">
	<div class="log-header">
		<span class="log-action">{action.replace(/_/g, ' ').toUpperCase()}</span>
		<span class="log-time">
			{GetDateTimeString(timestamp)}
		</span>
	</div>
	<div class="log-details">
		<div class="info-row">
			<span class="label">Target User ID:</span>
			{#if targetUserId}
				<span class="value">{targetUserId} <RedirectToOtherUser userId={targetUserId} /></span>
			{:else}
				(None)
			{/if}
		</div>
		{#if reason}
			<div class="info-row">
				<span class="label">Reason:</span>
				<span class="value">{reason}</span>
			</div>
		{/if}
		{#if content}
			<div class="info-row">
				<span class="label">Content:</span>
				<span class="value">{content}</span>
			</div>
		{/if}
		{#if suspensionDuration !== null}
			<div class="info-row">
				<span class="label">Suspension Duration:</span>
				<span class="value">
                    {#if suspensionDuration === null}
                        Permanent
                    {:else}
                        {GetExactTimeDifferenceString(suspensionDuration, 0)}
                    {/if}
				</span>
			</div>
		{/if}
		<div class="info-row">
			<span class="label">Suspension Applied:</span>
			{#if suspensionApplied}
				<span class="value">Yes</span>
			{:else}
				<span class="value">
					No
					{#if attemptedToApplySuspension}
						(Attempted)
					{/if}
				</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.log-item {
		background-color: var(--color-bg-main);
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
	}

	.log-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.log-action {
		font-weight: 600;
		color: var(--color-text);
		font-size: 0.9rem;
	}

	.log-time {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.log-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-row {
		display: flex;
		gap: 0.5rem;
	}

	.label {
		color: var(--color-text-secondary);
		font-weight: 600;
		font-size: 0.9rem;
		min-width: 150px;
	}

	.value {
		color: var(--color-text);
		word-break: break-word;
	}
</style>
