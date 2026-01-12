<script lang='ts'>
	import ContentContainer from '$lib/client/components/general/ContentContainer.svelte';
	import ChangePasswordForm from '$lib/client/components/forms/ChangePasswordForm.svelte';
	import ChangeUsernameForm from '$lib/client/components/forms/ChangeUsernameForm.svelte';
	import Button from '$lib/client/components/inputs/Button.svelte';
    import { LogOut, LogOutEverywhere } from '$lib/helpers/logout';
    import WindowedLayout from '$lib/client/components/general/WindowedLayout.svelte';
    import LocalStorageHelper from '$lib/client/helpers/local-storage';
    import CenterCard from '$lib/client/components/general/CenterCard.svelte';
    import OTCList from '$lib/client/components/user/OTCList.svelte';
    import ReturnToPageLink from '$lib/client/components/general/ReturnToPageLink.svelte';

	async function handleLogout() {
		await LogOut();
	}

	async function handleClearCache() {
		LocalStorageHelper.ClearServerConfigCache();
		LocalStorageHelper.ClearUserDataCache();
		window.location.reload();
	}

	async function handleLogoutEverywhere() {
		await LogOutEverywhere();
	}
</script>

<svelte:head>
	<title>Profile</title>
</svelte:head>

<!-- <WindowedLayout
	windows={[
		{
			title: "Change Username",
			content: changeUsernameSnippet
		},
		{
			title: "Change Password",
			content: changePasswordSnippet
		},
		{
			title: "Clear Cache",
			content: clearCacheSnippet
		},
		{
			title: "Logout",
			content: logoutSnippet
		}
	]}
/> -->

{#snippet changeUsernameSnippet()}
	<ChangeUsernameForm />
{/snippet}

{#snippet changePasswordSnippet()}
	<ChangePasswordForm />
{/snippet}

{#snippet clearCacheSnippet()}
	<Button type="button" on:click={handleClearCache}>
		Clear Cache
	</Button>
{/snippet}

{#snippet logoutSnippet()}
	<Button variant="danger" type="button" on:click={handleLogout}>
		Logout
	</Button>
{/snippet}

{#snippet logoutEverywhereSnippet()}
	<Button variant="danger" type="button" on:click={handleLogoutEverywhere}>
		Logout Everywhere (Not immediate)
	</Button>
{/snippet}

{#snippet otcList()}
	<OTCList/>
{/snippet}

<CenterCard>
	<div class="container">
		<ReturnToPageLink href="/home" text="Return to home" />
		{@render otcList()}
		{@render changeUsernameSnippet()}
		{@render changePasswordSnippet()}
		{@render clearCacheSnippet()}
		{@render logoutSnippet()}
		{@render logoutEverywhereSnippet()}
	</div>
</CenterCard>

<style>
	.container{
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 1rem;
	}
</style>