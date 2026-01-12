<script lang="ts">
	import { API } from "$lib/api/api";
	import TextInput from "$lib/client/components/inputs/TextInput.svelte";
	import Button from "$lib/client/components/inputs/Button.svelte";
	import Alert from "$lib/client/components/Alert.svelte";
	import { showNotification } from "$lib/client/stores/notifications";
	import { STRINGS } from "$lib/client/strings/main";

	let {
		onModeratorCreated
	}: {
		onModeratorCreated?: () => void;
	} = $props();

	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state('');
	let loading = $state(false);

	async function handleCreateModerator() {
		error = '';
		success = '';

		// Validation
		if (!username.trim()) {
			error = 'Username is required';
			return;
		}

		if (!password) {
			error = 'Password is required';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;
		const response = await API.admin.users.createModerator(username.trim(), password);
		loading = false;

		if (response.success) {
			success = `Moderator "${username}" created successfully!`;
			showNotification('success', `Moderator "${username}" created successfully`);
			username = '';
			password = '';
			confirmPassword = '';
			if (onModeratorCreated) {
				onModeratorCreated();
			}
		} else if (!response.success) {
			if (response.error?.code) {
				error = STRINGS.errors[response.error.code];
			} else {
				error = STRINGS.generic.unknownError + ` (${response.status})`;
			}
		}
	}
</script>

<div class="create-moderator-form">
	<h3>Create New Moderator</h3>

	<form onsubmit={(e) => { e.preventDefault(); handleCreateModerator(); }}>
		<div class="form-fields">
			<TextInput
				id="moderator-username"
				label="Username"
				type="text"
				bind:value={username}
				required
				disabled={loading}
			/>
	
			<TextInput
				id="moderator-password"
				label="Password"
				type="password"
				bind:value={password}
				required
				disabled={loading}
			/>

			<TextInput
				id="moderator-confirm-password"
				label="Confirm Password"
				type="password"
				bind:value={confirmPassword}
				required
				disabled={loading}
			/>
		</div>

		<Button type="submit" disabled={loading} showLoading={loading}>
			{loading ? 'Creating...' : 'Create Moderator'}
		</Button>

		<Alert message={error} type="error" />
		<Alert message={success} type="success" />
	</form>
</div>

<style>
	.create-moderator-form {
		width: 100%;
		padding: 2rem;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		background-color: var(--color-bg-secondary);
		margin-top: 2rem;
	}

	h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
