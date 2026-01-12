<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { API } from "$lib/api/api";
	import type { AdminAPITypes } from "$lib/api/types";
	import type { UserRole } from "$lib/server/db/types";
	import LoadingIcon from "../../icons/LoadingIcon.svelte";
	import { showNotification } from "$lib/client/stores/notifications";
	import { STRINGS } from "$lib/client/strings/main";
	import CreateModeratorForm from "../../forms/CreateModeratorForm.svelte";
	import TextInput from "../../inputs/TextInput.svelte";
	import Button from "../../inputs/Button.svelte";

	let admins = $state<AdminAPITypes.UserListItem[]>([]);
	let moderators = $state<AdminAPITypes.UserListItem[]>([]);
	let users = $state<AdminAPITypes.UserListItem[]>([]);
	let loading = $state(true);
	let searchUsername = $state("");
	let searchResults = $state<AdminAPITypes.UserListItem[]>([]);
	let searchLoading = $state(false);
	let showSearchResults = $state(false);

	function getRoleColor(role: UserRole): string {
		switch(role) {
			case "admin":
				return "var(--color-admin)";
			case "moderator":
				return "var(--color-moderator)";
			case "user":
			default:
				return "var(--color-user-general)";
		}
	}

	function getRoleLabel(role: UserRole): string {
		return role.charAt(0).toUpperCase() + role.slice(1);
	}

	async function loadUsers() {
		loading = true;
		
		const [adminsResponse, moderatorsResponse, usersResponse] = await Promise.all([
			API.admin.users.query("admin"),
			API.admin.users.query("moderator"),
			API.admin.users.query("user")
		]);

		loading = false;

		if (adminsResponse.success && adminsResponse.data) {
			admins = adminsResponse.data.users;
		} else if (!adminsResponse.success) {
			if (adminsResponse.error?.code) {
				showNotification('error', STRINGS.errors[adminsResponse.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${adminsResponse.status})`);
			}
		}

		if (moderatorsResponse.success && moderatorsResponse.data) {
			moderators = moderatorsResponse.data.users;
		} else if (!moderatorsResponse.success) {
			if (moderatorsResponse.error?.code) {
				showNotification('error', STRINGS.errors[moderatorsResponse.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${moderatorsResponse.status})`);
			}
		}

		if (usersResponse.success && usersResponse.data) {
			users = usersResponse.data.users;
		} else if (!usersResponse.success) {
			if (usersResponse.error?.code) {
				showNotification('error', STRINGS.errors[usersResponse.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${usersResponse.status})`);
			}
		}
	}

	function handleUserClick(userId: string) {
		goto(`/admin/user?id=${userId}`);
	}

	async function handleSearch() {
		if (!searchUsername.trim()) {
			showSearchResults = false;
			return;
		}

		searchLoading = true;
		const response = await API.admin.users.query(undefined, searchUsername.trim());
		searchLoading = false;

		if (response.success && response.data) {
			searchResults = response.data.users;
			showSearchResults = true;
		} else if (!response.success) {
			if (response.error?.code) {
				showNotification('error', STRINGS.errors[response.error.code]);
			} else {
				showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}

	function clearSearch() {
		searchUsername = "";
		searchResults = [];
		showSearchResults = false;
	}

	onMount(() => {
		loadUsers();
	});
</script>

<div class="user-list-container">
	<!-- Search Section -->
	<section class="search-section">
		<h2>Search</h2>
		<div class="search-form">
			<TextInput
				id="search-username"
				label="Username"
				type="text"
				bind:value={searchUsername}
				placeholder="Enter username to search..."
				disabled={searchLoading}
			/>
			<div class="search-buttons">
				<Button on:click={handleSearch} disabled={searchLoading || !searchUsername.trim()}>
					{searchLoading ? 'Searching...' : 'Search'}
				</Button>
				{#if showSearchResults}
					<Button on:click={clearSearch} disabled={searchLoading}>
						Clear
					</Button>
				{/if}
			</div>
		</div>

		{#if showSearchResults}
			<div class="search-results">
				<h3>Search Results ({searchResults.length})</h3>
				<div class="users-grid">
					{#each searchResults as user (user.id)}
						{@render userSnippet(user)}
					{:else}
						<p class="no-users">No users found.</p>
					{/each}
				</div>
			</div>
		{/if}
	</section>

	{#if loading}
		<div class="loading-container">
			<LoadingIcon />
			<p>Loading users...</p>
		</div>
	{:else}
		<!-- Admins Section -->
		<section class="role-section">
			<h2>Admins ({admins.length})</h2>
			<div class="users-grid">
				{#each admins as user (user.id)}
					{@render userSnippet(user)}
				{:else}
					<p class="no-users">No admins found.</p>
				{/each}
			</div>
		</section>

		<!-- Moderators Section -->
		<section class="role-section">
			<h2>Moderators ({moderators.length})</h2>
			<div class="users-grid">
				{#each moderators as user (user.id)}
					{@render userSnippet(user)}
				{:else}
					<p class="no-users">No moderators found.</p>
				{/each}
			</div>
		</section>

		<!-- Users Section -->
		<section class="role-section">
			<h2>Users ({users.length})</h2>
			<div class="users-grid">
				{#each users as user (user.id)}
					{@render userSnippet(user)}
				{:else}
					<p class="no-users">No users found.</p>
				{/each}
			</div>
		</section>

		<!-- Create Moderator Form -->
		<CreateModeratorForm onModeratorCreated={loadUsers} />
	{/if}
</div>

{#snippet userSnippet(user: AdminAPITypes.UserListItem)}
	<button class="user-snippet" onclick={() => handleUserClick(user.id)}>
		<div class="user-info">
			<span class="username">{user.username}</span>
			<span class="role-badge" style="background-color: {getRoleColor(user.role)}">
				{getRoleLabel(user.role)}
			</span>
		</div>
		<div class="user-id">ID: {user.id}</div>
	</button>
{/snippet}

<style>
	.user-list-container {
		width: 100%;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.search-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 2rem;
		border-bottom: 2px solid var(--color-border);
	}

	.search-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 500px;
	}

	.search-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.search-results {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.search-results h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
		font-size: 1.25rem;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
        max-height: 200px;
		gap: 1rem;
	}

	.loading-container p {
		color: var(--color-text-secondary);
		font-size: 1rem;
	}

	.role-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h2 {
		margin: 0;
		color: var(--color-text);
		font-size: 1.5rem;
		padding-bottom: 0.5rem;
		/* border-bottom: 2px solid var(--color-border); */
	}

	.users-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.no-users {
		color: var(--color-text-secondary);
		font-style: italic;
		padding: 1rem;
	}

	.user-snippet {
		width: 100%;
		padding: 1rem;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.user-snippet:hover {
		background-color: var(--color-bg-hover);
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.username {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.role-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
		color: white;
	}

	.user-id {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		font-family: monospace;
	}
</style>
