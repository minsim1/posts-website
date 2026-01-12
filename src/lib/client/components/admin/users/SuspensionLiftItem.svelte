<script lang="ts">
	import { GetDateTimeString } from "$lib/client/helpers/time";
	import DynamicTimeText from "../../general/DynamicTimeText.svelte";
    import RedirectToOtherUser from "./RedirectToOtherUser.svelte";

	let {
		timestamp,
		liftorUserId,
		reason
	}: {
		timestamp: number;
		liftorUserId: string;
		reason: string | null;
	} = $props();
</script>

<div class="lift-item">
	<div class="info-row">
		<span class="label">Lifted on:</span>
		<span class="value">
			{GetDateTimeString(timestamp)}
		</span>
	</div>
	<div class="info-row">
		<span class="label">Liftor ID:</span>
		<span class="value">{liftorUserId} <RedirectToOtherUser userId={liftorUserId} /></span>
	</div>
	<div class="info-row">
		<span class="label">Reason:</span>
		<span class="value">{reason || 'No reason provided'}</span>
	</div>
</div>

<style>
	.lift-item {
		background-color: var(--color-bg-main);
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
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
		min-width: 100px;
	}

	.value {
		color: var(--color-text);
		word-break: break-word;
	}
</style>
