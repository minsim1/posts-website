<script lang='ts'>
	import DynamicTimeText from "../general/DynamicTimeText.svelte";
	import { GetDateTimeString, GetExactTimeDifferenceString } from "$lib/client/helpers/time";
    import RedirectToOtherUser from "../admin/users/RedirectToOtherUser.svelte";

	let {
		timestamp,
		reason,
		suspendedUntilTimestamp,
        suspendorUserId,
        style
	}: {
		timestamp: number;
		reason: string;
		suspendedUntilTimestamp: number | null;
        suspendorUserId?: string;
        style?: string;
	} = $props();

	const isExpired = $derived(suspendedUntilTimestamp !== null && suspendedUntilTimestamp < Date.now());
	const isActive = $derived(suspendedUntilTimestamp !== null && suspendedUntilTimestamp > Date.now());
	
	const duration = $derived(
		suspendedUntilTimestamp !== null 
			? GetExactTimeDifferenceString(timestamp, suspendedUntilTimestamp)
			: 'Permanent'
	);
</script>

<div class="suspension-info" style={style}>
	<div class="info-row">
		<span class="label">Reason:</span>
		<span class="value">{reason || 'No reason provided'}</span>
	</div>
	<div class="info-row">
		<span class="label">Suspended on:</span>
		<span class="value">
			{GetDateTimeString(timestamp)}
		</span>
	</div>
	<div class="info-row">
		<span class="label">Status:</span>
		<span class="value">
			{#if suspendedUntilTimestamp === null}
				<span class="status-permanent">Permanent</span>
			{:else if isActive}
				Lifts in <DynamicTimeText timestamp={suspendedUntilTimestamp} type="time_until"/>
			{:else}
				<span class="status-expired">Expired <DynamicTimeText timestamp={suspendedUntilTimestamp} type="time_since"/> ago</span>
			{/if}
		</span>
	</div>
	<div class="info-row">
		<span class="label">Duration:</span>
		<span class="value">{duration}</span>
	</div>
    {#if suspendorUserId}
        <div class="info-row">
            <span class="label">Suspendor ID:</span>
            <span class="value">{suspendorUserId} <RedirectToOtherUser userId={suspendorUserId}/></span>
        </div>
    {/if}
</div>

<style>
	.suspension-info {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--color-bg-main);
		border-radius: 4px;
		/* border-left: 4px solid var(--color-warning); */
	}

	.info-row {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}

	.label {
		color: var(--color-text-secondary);
		font-weight: 600;
		min-width: 120px;
	}

	.value {
		color: var(--color-text);
		flex: 1;
	}

	.status-permanent {
		color: var(--color-danger);
		font-weight: 600;
	}

	.status-expired {
		color: var(--color-text-secondary);
	}
</style>
