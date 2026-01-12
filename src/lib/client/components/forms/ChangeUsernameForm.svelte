<script lang='ts'>
	import TextInput from '../inputs/TextInput.svelte';
	import Button from '../inputs/Button.svelte';
	import Alert from '../Alert.svelte';
    import { CheckUsernameValidity } from '$lib/helpers/validation';
    import LocalStorageHelper from '$lib/client/helpers/local-storage';
    import { API } from '$lib/api/api';
    import { LogOut } from '$lib/helpers/logout';
    import { ErrorCode, type APITypes, type SanitizedConfig, type SanitizedUser } from '$lib/api/types';
    import { STRINGS } from '$lib/client/strings/main';
    import { onMount } from 'svelte';
    import { GetApprxTimeDifferenceString } from '$lib/client/helpers/time';

	let newUsername = $state('');
	let password = $state('');
	
	let error = $state('');
	let success = $state('');
	let loading = $state(false);

	let config: SanitizedConfig | null = null;
	let user: SanitizedUser | null = null;

	async function loadData(){
		config = await LocalStorageHelper.GetServerConfigData();
		user = await LocalStorageHelper.GetUserData();
	}

	async function handleSubmit() {
		error = '';
		success = '';
        loading = false;

		if(!config){
			error = 'Unable to get server configuration.';
			return;
		}

		if(!user){
			error = 'Unable to get user data.';
			return;
		}

		if(!user.canChangeUsername){
			error = 'You are not allowed to change your username.';
			return;
		}

		const waitMsToChangeUsername =  user.lastUsernameChangeTimestamp + config.limits.minWaitToChangeUsername - Date.now();
		if(waitMsToChangeUsername > 0 && user.role !== "admin"){
			const waitTimeString = GetApprxTimeDifferenceString(waitMsToChangeUsername, 0);
			error = `You must wait ${waitTimeString} before changing your username again.`;
			return;
		}

		const validityCheck = CheckUsernameValidity(newUsername, config.disallowedUsernamePatterns);
		if(!validityCheck.valid){
			if(validityCheck.error == "too_long"){
				error = 'New username is too long.';
				return;
			}

			if(validityCheck.error == "too_short"){
				error = 'New username is too short.';
				return;
			}

			if(validityCheck.error == "invalid_characters"){
				error = 'New username contains invalid characters.';
				return;
			}

			if(validityCheck.error == "disallowed_pattern" && user.role !== "admin"){
				error = `New username contains a disallowed pattern: "${validityCheck.disallowedPattern}".`;
				return;
			}
		}

        loading = true;
        const response = await API.user.changeUsername(newUsername, password);
        loading = false;

        if(response.success){
            success = 'Username changed successfully.';
			newUsername = '';
			password = '';
			LocalStorageHelper.ClearUserDataCache();
			setTimeout(() => window.location.reload(), 500);
			return;
        }else{
			if(response.error){
				if(response.error.code == ErrorCode.Auth.INVALID_CREDENTIALS){
					error = 'Current password is incorrect.';
					return;
				}

				if(response.error.code == ErrorCode.Auth.USERNAME_TAKEN){
					error = 'The chosen username is already taken.';
					return;
				}

				if(response.error.code == ErrorCode.User.NOT_ALLOWED_TO_CHANGE_USERNAME){
					error = 'You are not allowed to change your username.';
					return;
				}

				if(response.error.code == ErrorCode.User.USERNAME_CHANGE_TOO_SOON){
					LocalStorageHelper.ClearServerConfigCache();
					LocalStorageHelper.ClearUserDataCache();
					loadData();
					error = 'You are changing your username too soon after the last change.';
					return;
				}

				if(response.error.code == ErrorCode.Auth.USERNAME_INVALID){
					error = 'The chosen username is invalid.';
					return;
				}

				if(response.error.code == ErrorCode.User.USER_NOT_FOUND){
					await LogOut();
				}

				error = STRINGS.errors[response.error.code]
				return;
			}else{
				error = STRINGS.generic.unknownError + ` (${response.status})`
			}
		}
	}

	onMount(()=>{
		loadData();
	})
</script>

<div class="change-username-form">
	<h2>Change Username</h2>
	
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<TextInput
			id="new-username"
			label="New Username"
			type="text"
			bind:value={newUsername}
			required
		/>
		
		<TextInput
			id="password"
			label="Password"
			type="password"
			bind:value={password}
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
			Change Username
		</Button>
	</form>
</div>

<style>
	.change-username-form {
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
