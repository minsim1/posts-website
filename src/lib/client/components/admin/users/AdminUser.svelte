<script lang="ts">
	import type { AdminAPITypes } from "$lib/api/types";
	import { ErrorCode } from "$lib/api/types";
	import DynamicTimeText from "../../general/DynamicTimeText.svelte";
	import Button from "../../inputs/Button.svelte";
	import UserSuspension from "../../moderation/UserSuspension.svelte";
	import UserBasicInfo from "./UserBasicInfo.svelte";
	import ModerationLogItem from "./ModerationLogItem.svelte";
	import SuspensionLiftItem from "./SuspensionLiftItem.svelte";
	import CollapsibleSection from "../../general/CollapsibleSection.svelte";
	import ConfirmationModal from "../../general/ConfirmationModal.svelte";
	import { API } from "$lib/api/api";
	import TextInput from "../../inputs/TextInput.svelte";
	import SuspensionSelect, { type SuspensionData } from "../../moderation/SuspensionSelect.svelte";
	import { showNotification } from "$lib/client/stores/notifications";
	import { STRINGS } from "$lib/client/strings/main";
	import TimeInput from "../../inputs/TimeInput.svelte";
	import { GetExactTimeDifferenceString } from "$lib/client/helpers/time";
	import Switch from "../../inputs/Switch.svelte";
    import { goto } from "$app/navigation";
    import OTC from "../../user/OTC.svelte";
    import Alert from "../../Alert.svelte";

	let {
		user,
		onUserDeleted,
		onUserUpdated
	}: {
		user: AdminAPITypes.User;
		onUserDeleted?: () => void;
		onUserUpdated?: () => void;
	} = $props();

	// Derived states
	let isSuspended = $derived(
		user.suspension == null ? false :
		user.suspension.suspendedUntilTimestamp == null ? true :
		user.suspension.suspendedUntilTimestamp > Date.now()
	);

	// User action states
	let showDeleteModal = $state(false);
	let newUsername = $state("");
	let newPassword = $state("");
	let confirmPassword = $state("");
	let verifyPasswordInput = $state("");
	let verifyPasswordResult = $state<boolean | null>(null);
	let liftReason = $state("");
	let applySuspension = $state(false);
	let suspensionData = $state<SuspensionData>({ reason: "", duration: null });
	let actionLoading = $state(false);
	
	// OTC management states
	let otcCount = $state("1");
	let otcDuration = $state(1000 * 60 * 60 * 24 * 30); // 30 days in milliseconds

	// Username change permission
	let canChangeUsername = $state(false);
	let previousCanChangeUsername = $state(false);
	let initialized = $state(false);

	// Initialize and handle changes
	$effect(() => {
		if (!initialized) {
			canChangeUsername = user.canChangeUsername;
			previousCanChangeUsername = user.canChangeUsername;
			initialized = true;
		} else if (user.canChangeUsername !== previousCanChangeUsername && !actionLoading) {
			// User prop changed externally
			canChangeUsername = user.canChangeUsername;
			previousCanChangeUsername = user.canChangeUsername;
		} else if (canChangeUsername !== previousCanChangeUsername && !actionLoading) {
			// User toggled the switch
			handleToggleCanChangeUsername();
		}
	});

	function redirectToOtherUserId(id: string){
		goto("/admin/user/" + encodeURIComponent(id));
	}

	async function handleChangeUsername() {
		if (!newUsername.trim()) {
			showNotification('error', "Username cannot be empty");
			return;
		}

		actionLoading = true;
		const response = await API.admin.users.changeUsername(user.id, newUsername.trim());
		actionLoading = false;

		if (response.success) {
			showNotification('success', "Username changed successfully");
			newUsername = "";
			if (onUserUpdated) onUserUpdated();
		} else {
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}

	async function handleChangePassword() {
		if (!newPassword) {
			showNotification('error', "Password cannot be empty");
			return;
		}

		if (newPassword !== confirmPassword) {
			showNotification('error', "Passwords do not match");
			return;
		}

		actionLoading = true;
		const response = await API.admin.users.changePassword(user.id, newPassword);
		actionLoading = false;

		if (response.success) {
			showNotification('success', "Password changed successfully");
			newPassword = "";
			confirmPassword = "";
		} else {
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}

	async function handleVerifyPassword() {
		if (!verifyPasswordInput) {
			showNotification('error', "Password cannot be empty");
			return;
		}

		actionLoading = true;
		verifyPasswordResult = null;
		const response = await API.admin.users.verifyPassword(user.id, verifyPasswordInput);
		actionLoading = false;

		if (response.success) {
			verifyPasswordResult = response.data.isCorrect;
		} else {
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}

	async function handleDeleteUser() {
		actionLoading = true;
		const response = await API.admin.users.deleteById(user.id);
		actionLoading = false;

		if (response.success) {
			showNotification('success', "User deleted successfully");
			if (onUserDeleted) onUserDeleted();
		} else {
			showDeleteModal = false;
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}

	async function handleSuspendUser() {
		actionLoading = true;
		const response = await API.admin.users.suspendUser(
			user.id,
			suspensionData.duration,
			suspensionData.reason.trim()
		);
		actionLoading = false;

		if (response.success) {
			showNotification('success', "User suspended successfully");
			applySuspension = false;
			suspensionData = { reason: "", duration: null };
			if (onUserUpdated) onUserUpdated();
		} else {
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}

	async function handleLiftSuspension() {
		actionLoading = true;
		const reason = liftReason.trim() || undefined;
		const response = await API.admin.users.liftSuspension(user.id, reason);
		actionLoading = false;

		if (response.success) {
			showNotification('success', "Suspension lifted successfully");
			liftReason = "";
			if (onUserUpdated) onUserUpdated();
		} else {
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}

	async function handleIssueOTCs() {
		const count = parseInt(otcCount);

		if (isNaN(count) || count < 1) {
			showNotification('error', "OTC count must be at least 1");
			return;
		}

		if (otcDuration < 1000) {
			showNotification('error', "Duration must be at least 1 second");
			return;
		}

		actionLoading = true;
		const response = await API.admin.otcs.issueToUser(user.id, otcDuration, count);
		actionLoading = false;

		if (response.success) {
			showNotification('success', `Successfully issued ${count} OTC${count > 1 ? 's' : ''}`);
			if (onUserUpdated) onUserUpdated();
		} else {
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}

	async function handleRemoveAllOTCs() {
		actionLoading = true;
		const response = await API.admin.otcs.deleteFromUser(user.id);
		actionLoading = false;

		if (response.success) {
			showNotification('success', "Successfully removed all user OTCs");
			if (onUserUpdated) onUserUpdated();
		} else {
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}

	async function handleToggleCanChangeUsername() {
		actionLoading = true;
		const newValue = canChangeUsername;
		const response = await API.admin.users.setCanChangeUsername(user.id, newValue);
		actionLoading = false;

		if (response.success) {
			showNotification('success', `User ${newValue ? 'can now' : 'can no longer'} change username`);
			previousCanChangeUsername = newValue;
			if (onUserUpdated) onUserUpdated();
		} else {
			// Revert the switch on error
			canChangeUsername = previousCanChangeUsername;
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}
</script>

<div class="admin-user-container">
	<!-- Basic Info Section -->
	<UserBasicInfo
		id={user.id}
		username={user.username}
		role={user.role}
		canChangeUsername={user.canChangeUsername}
	/>

	<!-- Current Suspension Section -->
	{#if isSuspended && user.suspension}
		<section class="section">
			<h2>Active Suspension</h2>
			<UserSuspension 
				style={"border: 1px solid var(--color-error);"}
				timestamp={user.suspension.timestamp}
				reason={user.suspension.reason}
				suspendedUntilTimestamp={user.suspension.suspendedUntilTimestamp}
				suspendorUserId={user.suspension.suspendorUserId}
			/>
		</section>
	{/if}

	<!-- Suspension History Section -->
	{#if user.suspensionHistory.length > 0}
		<CollapsibleSection title="Suspension History" count={user.suspensionHistory.length} defaultOpen={false}>
			{#each user.suspensionHistory as suspension}
				<div class="history-item">
					<UserSuspension 
						timestamp={suspension.timestamp}
						reason={suspension.reason}
						suspendedUntilTimestamp={suspension.suspendedUntilTimestamp}
						suspendorUserId={suspension.suspendorUserId}
					/>
				</div>
			{/each}
		</CollapsibleSection>
	{/if}

	<!-- OTCs Section -->
	{#if user.otcs.length > 0}
		<CollapsibleSection title="One-Time Codes" count={user.otcs.length} defaultOpen={false}>
			<div class="otcs-list">
				{#each user.otcs as otc}
					<OTC code={otc.code} expiresAtTimestamp={otc.expiresAtTimestamp}/>
				{/each}
			</div>
		</CollapsibleSection>
	{/if}

	<!-- Suspension Lift History Section -->
	{#if user.suspensionLiftHistory.length > 0}
		<CollapsibleSection title="Suspension Lift History" count={user.suspensionLiftHistory.length} defaultOpen={false}>
			{#each user.suspensionLiftHistory as lift}
				<SuspensionLiftItem
					timestamp={lift.timestamp}
					liftorUserId={lift.liftorUserId}
					reason={lift.reason}
				/>
			{/each}
		</CollapsibleSection>
	{/if}

	<!-- Moderation Logs Section -->
	{#if user.moderationLogs.length > 0}
		<CollapsibleSection title="Moderation Logs" count={user.moderationLogs.length} defaultOpen={false}>
			{#each user.moderationLogs as log}
				<ModerationLogItem
					action={log.action}
					timestamp={log.timestamp}
					targetUserId={log.targetUserId}
					reason={log.reason}
					content={log.content}
					suspensionDuration={log.suspensionDuration}
					suspensionApplied={log.suspensionApplied}
					attemptedToApplySuspension={log.attemptedToApplySuspension}
				/>
			{/each}
		</CollapsibleSection>
	{/if}

	<hr/>

	<!-- User Actions Section -->
	<section class="section user-actions">
		<!-- Change Username -->
		<div class="action-group">
			<h3>Change Username</h3>
			<div class="action-inputs">
				<TextInput
					id="new-username"
					label="New Username"
					type="text"
					bind:value={newUsername}
					disabled={actionLoading}
				/>
				<Button on:click={handleChangeUsername} disabled={actionLoading}>
					{actionLoading ? 'Updating...' : 'Change Username'}
				</Button>
			</div>
		</div>

		<!-- Change Password -->
		<div class="action-group">
			<h3>Change Password</h3>
			<div class="action-inputs">
				<TextInput
					id="new-password"
					bind:value={newPassword}
					type="password"
					label="New password"
					disabled={actionLoading}
				/>
				<TextInput
					id="confirm-password"
					label="Confirm password"
					bind:value={confirmPassword}
					type="password"
					disabled={actionLoading}
				/>
				<Button on:click={handleChangePassword} disabled={actionLoading}>
					{actionLoading ? 'Updating...' : 'Change Password'}
				</Button>
			</div>
		</div>

		<!-- Verify Password -->
		<div class="action-group">
			<h3>Verify Password</h3>
			<div class="action-inputs">
				<TextInput
					id="verify-password"
					bind:value={verifyPasswordInput}
					type="password"
					label="Password to verify"
					disabled={actionLoading}
				/>
				<Button on:click={handleVerifyPassword} disabled={actionLoading} showLoading={actionLoading}>
					Check password
				</Button>
				{#if verifyPasswordResult !== null}
					{#if verifyPasswordResult === true}
						<Alert type="success" message="Password is correct." />
					{:else}
						<Alert type="error" message="Password is incorrect." />
					{/if}
				{/if}
			</div>
		</div>

		<!-- Toggle Username Change Permission -->
		<div class="action-group">
			<h3>Username Change Permission</h3>
			<div class="action-inputs">
				<Switch
					label={canChangeUsername ? "User can change username" : "User cannot change username"}
					bind:checked={canChangeUsername}
					disabled={actionLoading}
				/>
			</div>
		</div>

		<!-- Suspend User -->
		<div class="action-group">
			<h3>Suspend User</h3>
			<SuspensionSelect
				applySuspension={true}
				bind:suspensionData
				onlyForm={true}
			/>
			<Button on:click={handleSuspendUser} disabled={actionLoading}>
				{actionLoading ? 'Suspending...' : 'Suspend User'}
			</Button>
		</div>

		<!-- Lift Suspension -->
		<div class="action-group">
			<h3>Lift Suspension</h3>
			<div class="action-inputs">
				<TextInput
					id="lift-reason"
					label="Reason (Optional)"
					type="text"
					bind:value={liftReason}
					placeholder="Enter reason for lifting suspension..."
					disabled={actionLoading}
				/>
				<Button on:click={handleLiftSuspension} disabled={actionLoading}>
					{actionLoading ? 'Lifting...' : 'Lift Suspension'}
				</Button>
			</div>
		</div>

		<!-- Issue OTCs -->
		<div class="action-group">
			<h3>Issue OTCs</h3>
			<div class="action-inputs">
				<TextInput
					id="otc-count"
					label="Number of OTCs"
					type="number"
					bind:value={otcCount}
					disabled={actionLoading}
				/>
				<TimeInput
					id="otc-duration"
					label={`Expiry Duration: (${GetExactTimeDifferenceString(otcDuration, 0)})`}
					bind:value={otcDuration}
				/>
				<Button on:click={handleIssueOTCs} disabled={actionLoading}>
					{actionLoading ? 'Issuing...' : 'Issue OTCs'}
				</Button>
			</div>
		</div>

		<!-- Remove All OTCs -->
		<div class="action-group danger">
			<h3>Remove All OTCs</h3>
			<p class="warning-text">This will remove all active OTCs for this user.</p>
			<Button 
				on:click={handleRemoveAllOTCs} 
				disabled={actionLoading}
				variant="danger"
			>
				{actionLoading ? 'Removing...' : 'Remove All OTCs'}
			</Button>
		</div>

		<!-- Delete User -->
		<div class="action-group danger">
			<h3>Delete User</h3>
			<p class="warning-text">This action cannot be undone.</p>
			<Button 
				on:click={() => showDeleteModal = true} 
				disabled={actionLoading}
				variant="danger"
			>
				Delete User
			</Button>
		</div>
	</section>
</div>

<!-- Delete Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showDeleteModal}
	title="Delete User"
	message="Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data."
	confirmText="Delete User"
	cancelText="Cancel"
	onConfirm={handleDeleteUser}
	dangerous={true}
/>

<style>
	.admin-user-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		width: 100%;
	}

	.section {
		background-color: var(--color-bg-secondary);
		border-radius: 8px;
	}

	h2 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
		font-size: 1.25rem;
	}

	h3 {
		margin: 0 0 0.75rem 0;
		color: var(--color-text);
		font-size: 1.1rem;
	}

	.otcs-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.history-item {
		background-color: var(--color-bg-main);
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
	}

	/* User Actions Section */
	.user-actions {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.action-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.5rem;
		background-color: var(--color-bg-main);
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.action-group.danger {
		border-color: var(--color-error);
	}

	.action-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.warning-text {
		color: var(--color-error);
		font-size: 0.9rem;
		margin: 0;
	}
</style>
