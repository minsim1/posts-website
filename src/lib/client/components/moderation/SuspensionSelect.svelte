<script lang='ts'>
	import Switch from "../inputs/Switch.svelte";
	import TextInput from "../inputs/TextInput.svelte";
	import TimeInput from "../inputs/TimeInput.svelte";
	import RadioGroup from "../inputs/RadioGroup.svelte";
    import { GetExactTimeDifferenceString } from "$lib/client/helpers/time";

	export interface SuspensionData {
		reason: string;
		duration: number | null; // null = permanent, number = milliseconds
	}

	let {
		applySuspension = $bindable(false),
		suspensionData = $bindable({ reason: "", duration: null } as SuspensionData),
		onlyForm = false
	}: {
		applySuspension: boolean;
		suspensionData: SuspensionData;
		onlyForm?: boolean;
	} = $props();

	type DurationType = "permanent" | "temporary";
	let durationType = $state<DurationType>("temporary");
	let tempDuration = $state<number>(1000 * 60 * 60 * 24);

	$effect(() => {
		if (durationType === "permanent") {
			suspensionData.duration = null;
		} else {
			suspensionData.duration = tempDuration;
		}
	});

	$effect(() => {
		if (!applySuspension) {
			suspensionData.reason = "";
			suspensionData.duration = null;
			durationType = "temporary";
		}
	});
</script>

{#if onlyForm}
	{@render form()}
{:else}
	<div class="suspension-select-container">
		<div class="suspension-header">
			<h3>User Suspension</h3>
			<Switch 
				label="Apply Suspension"
				bind:checked={applySuspension}
			/>
		</div>

		{#if applySuspension}
			{@render form()}
		{/if}
	</div>
{/if}


{#snippet form()}
	<div class="suspension-form">
		<TextInput 
			id="suspension-reason"
			label="Reason (Optional)"
			bind:value={suspensionData.reason}
			placeholder="Enter reason for suspension..."
		/>

		<RadioGroup 
			label="Duration Type:"
			name="duration-type"
			bind:value={durationType}
			options={[
				{ value: 'temporary', label: 'Temporary' },
				{ value: 'permanent', label: 'Permanent' }
			]}
		/>

		{#if durationType === "temporary"}
			<TimeInput 
				id="suspension-duration"
				label={`Suspension Duration: (${GetExactTimeDifferenceString(tempDuration, 0)})`}
				bind:value={tempDuration}
			/>
		{/if}
	</div>
{/snippet}

<style>
	.suspension-select-container {
		background-color: var(--color-bg-secondary);
		border-radius: 8px;
		padding: 1.5rem;
		border: 2px solid var(--color-border);
	}

	.suspension-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.suspension-header h3 {
		margin: 0;
		color: var(--color-text);
		font-size: 1.25rem;
	}

	.suspension-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}
</style>
