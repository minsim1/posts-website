<script lang="ts">
	import { API } from "$lib/api/api";
	import { showNotification } from "$lib/client/stores/notifications";
	import { STRINGS } from "$lib/client/strings/main";
	import Button from "../../inputs/Button.svelte";
	import TextInput from "../../inputs/TextInput.svelte";
	import TimeInput from "../../inputs/TimeInput.svelte";
	import Switch from "../../inputs/Switch.svelte";
	import CollapsibleSection from "../../general/CollapsibleSection.svelte";
	import ConfirmationModal from "../../general/ConfirmationModal.svelte";
	import type { UserRole } from "$lib/server/db/types";
    import { GetApprxTimeDifferenceString } from "$lib/client/helpers/time";

	// Statistics
	let otcStatistics = $state<{ count: number } | null>(null);
	let statisticsLoading = $state(false);

	// Issue OTCs to roles
	let issueToAdmins = $state(false);
	let issueToModerators = $state(false);
	let issueToUsers = $state(true);
	let countPerUser = $state("1");
	let otcDuration = $state(1000 * 60 * 60 * 24 * 7); // milliseconds
	let issueLoading = $state(false);

	// Delete all OTCs
	let showDeleteAllModal = $state(false);
	let deleteAllLoading = $state(false);

	// Load statistics on mount
	async function loadStatistics() {
		statisticsLoading = true;
		const response = await API.admin.otcs.statistics();
		statisticsLoading = false;

		if (response.success && response.data) {
			otcStatistics = response.data;
		} else {
			if(response.success === false && response.error){
				showNotification('error', STRINGS.errors[response.error.code]);
				return;
			}else{
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
				return;
			}
		}
	}

	async function handleIssueOTCs() {
		// Validation
		const roles: UserRole[] = [];
		if (issueToAdmins) roles.push("admin");
		if (issueToModerators) roles.push("moderator");
		if (issueToUsers) roles.push("user");

		if (roles.length === 0) {
			showNotification('error', 'Please select at least one role');
			return;
		}

		const count = parseInt(countPerUser);
		if (isNaN(count) || count < 1) {
			showNotification('error', 'Count must be at least 1');
			return;
		}

		if (otcDuration < 1000) {
			showNotification('error', 'Duration must be at least 1 second');
			return;
		}

		issueLoading = true;
		const response = await API.admin.otcs.issueToRoles(roles, otcDuration, count);
		issueLoading = false;

		if (response.success) {
			showNotification('success', `Successfully issued OTCs`);
			// Reset form
			countPerUser = "1";
			otcDuration = 1000 * 60 * 60 * 24 * 7;
			// Reload statistics
			await loadStatistics();
		} else {
			if(response.success === false && response.error){
				showNotification('error', STRINGS.errors[response.error.code]);
				return;
			}else{
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
				return;
			}
		}
	}

	async function handleDeleteAllOTCs() {
		deleteAllLoading = true;
		const response = await API.admin.otcs.deleteAll();
		deleteAllLoading = false;

		if (response.success) {
			showNotification('success', 'Successfully deleted all OTCs');
			showDeleteAllModal = false;
			// Reload statistics
			await loadStatistics();
		} else {
			if(response.success === false && response.error){
				showNotification('error', STRINGS.errors[response.error.code]);
				return;
			}else{
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
				return;
			}
		}
	}

	// Load statistics on mount
	loadStatistics();
</script>

<div class="otc-management">
	<h2>OTC Management</h2>

	<!-- Statistics Section -->
	<div class="statistics-content">
		{#if statisticsLoading}
			<p class="loading">Loading statistics...</p>
		{:else if otcStatistics}
			<h2>Total OTCs: {otcStatistics.count}</h2>
		{:else}
			<p class="error-text">Failed to load statistics</p>
		{/if}
	</div>

	<hr/>

	<h2>Issue OTCs</h2>

	<div class="issue-content">
		<div class="roles-selection">
			<h3>Select Roles</h3>
			<Switch label="Admins" bind:checked={issueToAdmins} />
			<Switch label="Moderators" bind:checked={issueToModerators} />
			<Switch label="Users" bind:checked={issueToUsers} />
		</div>

		<div class="issue-inputs">
			<TextInput
				label="Count per User"
				bind:value={countPerUser}
				type="number"
				id="count-per-user"
				placeholder="1"
			/>

			<TimeInput
				label={`Duration ${GetApprxTimeDifferenceString(otcDuration, 0)}`}
				bind:value={otcDuration}
				id="otc-duration"
			/>
		</div>

		<Button on:click={handleIssueOTCs} showLoading={issueLoading}>
			Issue OTCs
		</Button>
	</div>

	<hr/>

	<!-- Delete All OTCs Section -->
	<div class="delete-content">
		<Button on:click={() => showDeleteAllModal = true} variant="danger">
			Delete All OTCs
		</Button>
	</div>
</div>

<!-- Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showDeleteAllModal}
	title="Delete All OTCs"
	message="Are you sure you want to delete ALL OTCs? This action cannot be undone."
	confirmText="Delete All"
	onConfirm={handleDeleteAllOTCs}
	showLoading={deleteAllLoading}
	dangerous={true}
/>

<style>
	.otc-management {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	h2 {
		color: var(--color-text);
		font-size: 1.5rem;
		margin: 0;
	}

	h3 {
		color: var(--color-text);
		font-size: 1.1rem;
		margin: 0 0 0.75rem 0;
	}

	.statistics-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.loading {
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.error-text {
		color: var(--color-danger);
	}

	.issue-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.roles-selection {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.issue-inputs {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.delete-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
