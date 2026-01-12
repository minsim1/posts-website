<script lang='ts'>
	import Button from "../inputs/Button.svelte";
	import { API } from "$lib/api/api";
	import { ErrorCode, type APITypes } from "$lib/api/types";
	import { showNotification } from "$lib/client/stores/notifications";
	import UserSuspension from "./UserSuspension.svelte";
    import { STRINGS } from "$lib/client/strings/main";
    import Alert from "../Alert.svelte";

	let {
		type,
		id
	}: {
		type: "post" | "comment";
		id: string;
	} = $props();

	let loading = $state(false);
	let suspension = $state<
		{
			reason: string;
			suspendedUntilTimestamp: number | null;
			timestamp: number;
		} | null>(null);
	let checked = $state(false);
	let suspensionCheckInfo = $state("");

	async function handleCheck() {
		loading = true;
		checked = true;

		const response = await API.moderation.getAuthorLastSuspension(type, id);
		loading = false;

		if (response.success) {
			suspension = response.data.suspension;
			// if (!suspension) {
			// 	showNotification('info', 'This author has no previous suspensions.');
			// }
		} else {
			if(response.error){
				if(response.error.code === ErrorCode.Moderation.AUTHOR_ID_EXPUNGED){
					checked = true;
					suspensionCheckInfo = "No associated author found for this content.";
					showNotification('error', STRINGS.errors[ErrorCode.Moderation.AUTHOR_ID_EXPUNGED]);
					return;
				}

				if(response.error.code === ErrorCode.User.USER_NOT_FOUND){
					checked = true;
					suspensionCheckInfo = "Author user account not found.";
					showNotification('error', STRINGS.errors[ErrorCode.User.USER_NOT_FOUND]);
					return;
				}

				showNotification('error', STRINGS.errors[response.error.code]);
			}else{
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}
</script>

<div class="last-suspension-container">
	<h3>Last Author Suspension</h3>
	
	{#if !checked}
		<Button 
			type="button" 
			variant="secondary" 
			showLoading={loading}
			on:click={handleCheck}
		>
			Check Last Suspension
		</Button>
	{:else if suspension}
		<UserSuspension 
			timestamp={suspension.timestamp}
			reason={suspension.reason}
			suspendedUntilTimestamp={suspension.suspendedUntilTimestamp}
		/>
	{:else}
		{#if suspensionCheckInfo}
			<p class="no-suspension">{suspensionCheckInfo}</p>
		{:else}
			<p class="no-suspension">No previous suspensions found.</p>
		{/if}
		<!-- <Button 
			type="button" 
			variant="outline" 
			fullWidth={false}
			on:click={() => checked = false}
		>
			Hide
		</Button> -->
	{/if}
</div>

<style>
	.last-suspension-container {
		background-color: var(--color-bg-secondary);
		border-radius: 8px;
		padding: 1.5rem;
		border: 2px solid var(--color-border);
	}

	h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
		font-size: 1.25rem;
	}

	.no-suspension {
		color: var(--color-text-secondary);
		font-style: italic;
		margin: 1rem 0;
	}
</style>
