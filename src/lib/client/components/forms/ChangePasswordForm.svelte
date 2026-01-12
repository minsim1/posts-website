<script lang='ts'>
	import TextInput from '../inputs/TextInput.svelte';
	import Button from '../inputs/Button.svelte';
	import Alert from '../Alert.svelte';
    import LocalStorageHelper from '$lib/client/helpers/local-storage';
    import { CheckPasswordValidity, CheckUsernameValidity } from '$lib/helpers/validation';
    import { API } from '$lib/api/api';
    import { LogOut, LogOutEverywhere } from '$lib/helpers/logout';
    import { STRINGS } from '$lib/client/strings/main';
    import { ErrorCode } from '$lib/api/types';
    import Modal from '../Modal.svelte';

	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	
	let error = $state('');
	let success = $state('');
    let loading = $state(false);

	let logOutEverywhereModalOpen = $state(false);

	async function handleSubmit() {
		error = '';
		success = '';
        loading = false;

        if(newPassword !== confirmPassword){
            error = 'New password and confirmation do not match.';
            return;
        }

		const validityCheck = CheckPasswordValidity(newPassword);
		if(!validityCheck.valid){
			if(validityCheck.error == "too_long"){
				error = 'New password is too long.';
				return;
			}

			if(validityCheck.error == "too_short"){
				error = 'New password is too short.';
				return;
			}

			error = 'New password is invalid.';
			return;
		}

        loading = true;
        const response = await API.user.changePassword(oldPassword, newPassword);
        loading = false;

        if(response.success){
            success = 'Password changed successfully.';
			oldPassword = '';
			newPassword = '';
			confirmPassword = '';
			logOutEverywhereModalOpen = true;
			return;
        }else{
			if(response.status == 401){
				await LogOut();
				return;
			}

			if(response.error){
				if(response.error.code = ErrorCode.Auth.INVALID_CREDENTIALS){
					error = 'Current password is incorrect.';
					return;
				}
				error = STRINGS.errors[response.error.code]
				return;
			}else{
				error = STRINGS.generic.unknownError + ` (${response.status})`
			}
		}
	}

	let logOutEverywhereLoading = $state(false);

	async function handleLogOutEverywhere(){
		logOutEverywhereModalOpen = true;
		await LogOutEverywhere();
	}
</script>

<div class="change-password-form">
	<h2>Change Password</h2>
	
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<TextInput
			id="old-password"
			label="Current Password"
			type="password"
			bind:value={oldPassword}
			required
		/>
		
		<TextInput
			id="new-password"
			label="New Password"
			type="password"
			bind:value={newPassword}
			required
		/>
		
		<TextInput
			id="confirm-password"
			label="Confirm New Password"
			type="password"
			bind:value={confirmPassword}
			required
		/>

		{#if error}
			<Alert type="error" message={error} />
		{/if}
		
		{#if success}
			<Alert type="success" message={success} />
		{/if}

		{#if loading}
			<p>Loading...</p>
		{/if}

		<Button type="submit" variant="primary" fullWidth>
			Change Password
		</Button>
	</form>
</div>

<Modal isOpen={logOutEverywhereModalOpen} onClose={() => logOutEverywhereModalOpen = false} title="Please Log Out Everywhere">
	<div class="logout-warning-container">
		<p>For security reasons, please log out from all other sessions and log back in.</p>
		<div class="buttons-container">
			<Button variant="secondary" on:click={()=> { logOutEverywhereModalOpen = false; }}>
				I don't care...
			</Button>
			<Button variant="danger" on:click={handleLogOutEverywhere} showLoading={logOutEverywhereLoading}>
				Log Out Everywhere
			</Button>
		</div>
	</div>
</Modal>


<style>
	.logout-warning-container{
		display: flex;
		flex-direction: column;
	}

	.buttons-container{
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	p{
		margin-bottom: 1.5rem;
		color: var(--color-warning);
		font-weight: bold;
		font-size: 1rem;
	}

	.change-password-form {
		width: 100%;
		max-width: 500px;
        background-color: var(--color-bg-light);
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	h2 {
		margin: 0 0 1.5rem 0;
		color: var(--color-text);
		font-size: 1.5rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
