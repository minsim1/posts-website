<script lang="ts">
	import { API } from '$lib/api/api';
	import { type SanitizedUser, type SanitizedConfig } from '$lib/api/types';
	import { onMount } from 'svelte';
    import AdminConfigPanel from '$lib/client/components/admin/config/AdminConfigPanel.svelte';
    import LocalStorageHelper from '$lib/client/helpers/local-storage';
    import WindowedLayout from '$lib/client/components/general/WindowedLayout.svelte';
	import UserList from '$lib/client/components/admin/users/UserList.svelte';
    import OTCManagement from '$lib/client/components/admin/otc/OTCManagement.svelte';
    import AdminRecordsManaging from '$lib/client/components/admin/records/AdminRecordsManaging.svelte';
    import AdminInstaPostManagement from '$lib/client/components/admin/instagram-posts/AdminInstaPostManagement.svelte';

	let user = $state<SanitizedUser | null>(null);
	let loading = $state(true);

	async function loadData(){
		loading = true;
		user = await LocalStorageHelper.GetUserData();
		loading = false;
		if(!user){
			window.location.href = "/login";
		}else if(user.role !== 'admin'){
			window.location.href = "/home";
		}
	}

	onMount(async () => {
		await loadData();
	});
</script>

<svelte:head>
	<title>Admin Panel</title>
</svelte:head>

{#if loading}
	<div class="container">
		<div class="card">
			<p>Loading...</p>
		</div>
	</div>
{:else if user}
	<WindowedLayout
		windows={[
			{
				title: "Server Configuration",
				content: serverConfig
			},
			{
				title: "User Management",
				content: userManagement
			},
			{
				title: "OTC Management",
				content: otcManagement
			},
			{
				title: "Records Management",
				content: recordsManagement
			},
			{
				title: "Instagram Post Management",
				content: instagramPosts
			}
		]}
	/>
{/if}

{#snippet instagramPosts()}
	<AdminInstaPostManagement />
{/snippet}

{#snippet serverConfig()}
	<AdminConfigPanel />
{/snippet}

{#snippet otcManagement()}
	<OTCManagement />
{/snippet}

{#snippet userManagement()}
	<UserList />
{/snippet}

{#snippet recordsManagement()}
	<AdminRecordsManaging />
{/snippet}

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		flex: 1;
	}

	.card {
		width: 100%;
		max-width: 600px;
		padding: 2rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}
</style>
