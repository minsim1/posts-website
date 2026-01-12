<script lang="ts">
	import { API } from "$lib/api/api";
	import TextInput from "$lib/client/components/inputs/TextInput.svelte";
	import Button from "$lib/client/components/inputs/Button.svelte";
	import Alert from "$lib/client/components/Alert.svelte";
    import { STRINGS } from "$lib/client/strings/main";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import Modal from "../Modal.svelte";

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	let suspensionData: {
		suspensionReason?: string;
		suspendedUntilTimestamp: number | null;
	} | null = null;

	function closeModal() {
		suspensionData = null;
	}

	async function handleLogin() {
		error = '';

		LocalStorageHelper.ClearUserDataCache();

		loading = true;
		const response = await API.auth.login(username, password);

		if(response.success){
			if(response.data.type === "suspended"){
				loading = false;
				suspensionData = {
					suspensionReason: response.data.suspensionReason,
					suspendedUntilTimestamp: response.data.suspendedUntilTimestamp
				}
				// let tempErrorString = STRINGS.generic.login.suspension.main + '.\n';
				// if(response.data.suspensionReason){
				// 	tempErrorString += STRINGS.generic.login.suspension.reasonPrefix + response.data.suspensionReason + '.\n';
				// }
				// if(response.data.suspendedUntilTimestamp){
				// 	const date = new Date(response.data.suspendedUntilTimestamp);
				// 	tempErrorString += STRINGS.generic.login.suspension.suspendedUntilPrefix + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + '.\n';
				// }else{
				// 	tempErrorString += STRINGS.generic.login.suspension.permanentSuspension + '.\n';
				// }
				// error = tempErrorString;
				return;
			}else{
				LocalStorageHelper.ClearUserDataCache();
				LocalStorageHelper.ClearServerConfigCache();
				await LocalStorageHelper.GetUserData().catch();
				await LocalStorageHelper.GetServerConfigData().catch();
				LocalStorageHelper.SetJwtExpirationTimestamp(response.data.jwtExpiresAtTimestamp);
				window.location.href = '/home';
				return;
			}
		}else{
			loading = false;

			if(!response.error){
				error = STRINGS.generic.unknownError + ` ${response.status}`;
				return;
			}else{
				error = STRINGS.errors[response.error.code];
			}
		}
	}
</script>

{#if suspensionData}
	<Modal isOpen={true} onClose={closeModal} title="Account Suspended">
		<div class="suspension-container">
			{#if suspensionData.suspendedUntilTimestamp}
				<p><strong>Your account has been suspended</strong></p>
				<p>Suspension will lift on: <strong>{new Date(suspensionData.suspendedUntilTimestamp).toLocaleString()}</strong></p>
			{:else}
				<p><strong>Your account has been permanentelly suspended</strong></p>
			{/if}

			{#if suspensionData.suspensionReason}
				<p>Reason: <strong>{suspensionData.suspensionReason}</strong></p>
			{/if}
		</div>
	</Modal>
{/if}

<div class="auth-card">
	<h1>Login</h1>

	<form on:submit|preventDefault={handleLogin}>
		<div>
			<TextInput
				id="username"
				label={STRINGS.generic.auth.username}
				type="text"
				bind:value={username}
				required
			/>
	
			<TextInput
				id="password"
				label={STRINGS.generic.auth.password}
				type="password"
				bind:value={password}
				required
			/>
		</div>

		<Button type="submit" disabled={loading} showLoading={loading}>
			{loading ? 'Loading...' : 'Login'}
		</Button>

		<Alert message={error} type="error" />
	</form>

	<p class="link">
		Don't have an account? <a href="/register">Register</a>
	</p>
</div>

<style>
	.auth-card {
		width: 100%;
		max-width: 400px;
		padding: 2rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}

	.suspension-container{
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.suspension-container p{
		text-align: center;
		color: var(--color-error);
	}

	h1 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
	}

	.link {
		margin-top: 1rem;
		text-align: center;
		font-size: 0.9rem;
	}

	form{
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
