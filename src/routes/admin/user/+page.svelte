<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import LocalStorageHelper from "$lib/client/helpers/local-storage";
	import ContentContainer from "$lib/client/components/general/ContentContainer.svelte";
	import LoadingIcon from "$lib/client/components/icons/LoadingIcon.svelte";
	import { API } from "$lib/api/api";
	import { LogOut } from "$lib/helpers/logout";
	import { STRINGS } from "$lib/client/strings/main";
	import type { AdminAPITypes } from "$lib/api/types";
	import AdminUser from "$lib/client/components/admin/users/AdminUser.svelte";
    import CenterCard from "$lib/client/components/general/CenterCard.svelte";
    import Button from "$lib/client/components/inputs/Button.svelte";
    import ReturnToPageLink from "$lib/client/components/general/ReturnToPageLink.svelte";

	interface UserData {
		id: string;
		username: string;
		role: 'admin' | 'user' | 'moderator';
	}

	let currentUser = $state<UserData | null>(null);
	let targetUserId = $state<string | null>(null);
	let error = $state("");
	let loading = $state(true);
	let userData = $state<AdminAPITypes.User | null>(null);
	let useMockData = $state(false); // Toggle to use mock data

	// Mock data for testing
	const mockUserData: AdminAPITypes.User = {
		id: "693b17e811af6766062e309a",
		username: "test_user_42",
		role: "moderator",
		canChangeUsername: true,
		suspension: {
			timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
			reason: "Inappropriate behavior in comments section",
			suspendedUntilTimestamp: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days from now
			suspendorUserId: "admin_user_003"
		},
		otcs: [
			{
				code: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
				expiresAtTimestamp: Date.now() + 24 * 60 * 60 * 1000 // 1 day
			},
			{
				code: "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4",
				expiresAtTimestamp: Date.now() + 3 * 24 * 60 * 60 * 1000 // 3 days
			},
			{
				code: "m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6",
				expiresAtTimestamp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
			}
		],
		suspensionHistory: [
            {
                timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
                reason: "Inappropriate behavior in comments section",
                suspendedUntilTimestamp: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days from now
                suspendorUserId: "admin_user_003"
            },
			{
				timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
				reason: "Spam posting",
				suspendedUntilTimestamp: Date.now() - 23 * 24 * 60 * 60 * 1000, // Ended 23 days ago
				suspendorUserId: "admin_user_001"
			},
			{
				timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
				reason: "Offensive language",
				suspendedUntilTimestamp: Date.now() - 57 * 24 * 60 * 60 * 1000, // Ended 57 days ago
				suspendorUserId: "admin_user_002"
			},
			{
				timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
				reason: "Multiple rule violations",
				suspendedUntilTimestamp: Date.now() - 83 * 24 * 60 * 60 * 1000, // Ended 83 days ago
				suspendorUserId: "admin_user_001"
			}
		],
		suspensionLiftHistory: [
			{
				timestamp: Date.now() - 23 * 24 * 60 * 60 * 1000, // 23 days ago
				liftorUserId: "admin_user_001",
				reason: "Good behavior, early release"
			},
			{
				timestamp: Date.now() - 57 * 24 * 60 * 60 * 1000, // 57 days ago
				liftorUserId: "admin_user_002",
				reason: "Appeal accepted"
			}
		],
		moderationLogs: [
			{
				action: "delete_post",
				timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
				targetUserId: "user_target_001",
				reason: "Spam content",
				content: "This is spam content that was removed",
				suspensionDuration: null,
				suspensionApplied: false,
				attemptedToApplySuspension: false
			},
			{
				action: "suspend_user",
				timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
				targetUserId: "user_target_002",
				reason: "Repeated violations",
				content: null,
				suspensionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
				suspensionApplied: true,
				attemptedToApplySuspension: false
			},
			{
				action: "delete_comment",
				timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
				targetUserId: "user_target_003",
				reason: "Offensive language",
				content: "Removed offensive comment",
				suspensionDuration: null,
				suspensionApplied: false,
				attemptedToApplySuspension: true
			},
			{
				action: "lift_suspension",
				timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
				targetUserId: "user_target_004",
				reason: "Appeal approved",
				content: null,
				suspensionDuration: null,
				suspensionApplied: false,
				attemptedToApplySuspension: false
			},
			{
				action: "delete_comment",
				timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
				targetUserId: "user_target_005",
				reason: "Minor rule violation",
				content: "Warned comment content",
				suspensionDuration: null,
				suspensionApplied: false,
				attemptedToApplySuspension: false
			}
		]
	};

	async function loadUserData(): Promise<boolean> {
		const user = await LocalStorageHelper.GetUserData();
		
		if (!user) {
			goto('/home');
			return false;
		}

		if (user.role !== 'admin') {
			goto('/home');
			return false;
		}

		currentUser = user;
		return true;
	}

	function checkUrlParams(): boolean {
		const urlParams = new URLSearchParams(window.location.search);
		const id = urlParams.get('id');

		if (!id) {
			error = "The page URL is malformed. Please check the link and try again.";
			return false;
		}

		targetUserId = id;
		return true;
	}

	async function loadUser() {
		if (useMockData) {
			// Use mock data instead of API call
			loading = true;
			setTimeout(() => {
				userData = mockUserData;
				loading = false;
			}, 500); // Simulate loading delay
			return;
		}

		loading = true;
		const response = await API.admin.users.getById(targetUserId!);
		loading = false;

		if (response.success) {
			userData = response.data.user;
		} else {
			if (response.status == 401 || response.status == 403) {
				return LogOut();
			}

			if (response.status == 404) {
				error = "The user you are trying to view does not exist.";
				return;
			}

			error = STRINGS.generic.unknownError + ` (${response.status})`;
		}
	}

	onMount(async () => {
		const userValid = await loadUserData();
		if (!userValid) return;

		const urlValid = checkUrlParams();	
		if (!urlValid) return;

		await loadUser();
	});

	function handleReturnToAdminPanel() {
		goto('/admin');
	}

	function handleUserDeleted() {
		goto('/admin');
	}

	async function handleUserUpdated() {
		await loadUser();
	}
</script>

<svelte:head>
	<title>Admin user control</title>
</svelte:head>

<CenterCard>
    {#if error}
        <p class="error">{error}</p>
        {@render returnToAdminPanelButton()}
    {:else if loading}
        <div class="loading-container">
            <LoadingIcon />
            <p>Loading user data...</p>
        </div>
    {:else if userData}
        {@render returnToAdminPanelButton()}
        <AdminUser 
			user={userData} 
			onUserDeleted={handleUserDeleted}
			onUserUpdated={handleUserUpdated}
		/>
    {/if}
</CenterCard>

{#snippet returnToAdminPanelButton()}
	<ReturnToPageLink href="/admin" text="Return to admin panel" />
{/snippet}

<style>
	.error {
		color: var(--color-danger);
		text-align: center;
        font-size: 1.5rem;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
        max-height: 200px;
		color: var(--color-text-secondary);
	}
</style>
