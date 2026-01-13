<script lang="ts">
	import CheckboxInput from './../inputs/CheckboxInput.svelte';
	import { API, ApiRequest } from "$lib/api/api";
	import TextInput from "$lib/client/components/inputs/TextInput.svelte";
	import SelectInput from "$lib/client/components/inputs/SelectInput.svelte";
	import Button from "$lib/client/components/inputs/Button.svelte";
	import Alert from "$lib/client/components/Alert.svelte";
    import HelpButton from "../general/HelpButton.svelte";
    import { ErrorCode, type SanitizedConfig } from "$lib/api/types";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { onMount } from "svelte";
    import { CheckPasswordValidity, CheckUsernameValidity } from "$lib/helpers/validation";
    import { STRINGS } from "$lib/client/strings/main";

	let username = '';
	let password = '';
	let passwordConfirm = '';
	let registrationOTC = '';
	let legalConfirmChecked = false;
	let error = '';
	let loading = false;
	let config: SanitizedConfig | null = null;

	async function loadConfig(){
		config = await LocalStorageHelper.GetServerConfigData();
	}

	async function getOtcFromParams(){
		const urlParams = new URLSearchParams(window.location.search);
		const otcParam = urlParams.get('otc');
		if(otcParam){
			registrationOTC = otcParam;
		}
	}

	onMount(async ()=>{
		await loadConfig();
		await getOtcFromParams();
	})

	async function handleRegister() {
		error = '';

		if(!legalConfirmChecked){
			error = 'You must agree to the Terms of Service and Privacy Policy to register.';
			return;
		}

		if(password !== passwordConfirm){
			error = 'Password and confirmation do not match.';
			return;
		}

		if(config){
			const usernameValidity = CheckUsernameValidity(username, config.disallowedUsernamePatterns)
			if(!usernameValidity.valid){
				if(usernameValidity.error == "too_long"){
					error = 'Username is too long.';
					return;
				}

				if(usernameValidity.error == "too_short"){
					error = 'Username is too short.';
					return;
				}

				if(usernameValidity.error == "disallowed_pattern"){
					error = 'Username contains a disallowed pattern: ' + usernameValidity.disallowedPattern;
					return;
				}

				error = 'Username is invalid.';
				return;
			}

			const passwordValiditiy = CheckPasswordValidity(password);
			if(!passwordValiditiy.valid){
				if(passwordValiditiy.error == "too_long"){
					error = 'Password is too long.';
					return;
				}

				if(passwordValiditiy.error == "too_short"){
					error = 'Password is too short.';
					return;
				}

				error = 'Password is invalid.';
				return;
			}
		}

		loading = true;
		const response = await API.auth.register(username, password, registrationOTC);

		if(response.success){
			LocalStorageHelper.ClearUserDataCache();
			LocalStorageHelper.SetJwtExpirationTimestamp(response.data.jwtExpiresAtTimestamp);
			LocalStorageHelper.GetUserData().finally(() => {
				loading = false;
				window.location.href = '/home';
			});
			return;
		}else{
			loading = false;
			console.log(response);
			if(!response.error){
				error = STRINGS.generic.unknownError + ` (${response.status})`;
				return;
			}

			if(response.error.code === ErrorCode.Auth.USERNAME_INVALID){
				LocalStorageHelper.ClearUserDataCache();
				LocalStorageHelper.ClearServerConfigCache();
				loadConfig();
				error = 'Username is invalid.';
				return;
			}

			if(response.error.code == ErrorCode.Auth.USERNAME_TAKEN){
				LocalStorageHelper.ClearUserDataCache();
				LocalStorageHelper.ClearServerConfigCache();
				loadConfig();
				error = 'Username is already taken.';
				return;
			}

			if(response.error.code == ErrorCode.Auth.OTC_INVALID){
				error = 'Registration OTC is invalid. It may have already been used.';
				return;
			}
			
			error = STRINGS.errors[response.error.code];
			return;
		}
	}

	onMount(()=>{
		loadConfig();
	})
</script>

<div class="auth-card">
	<h1>Register</h1>

	<form on:submit|preventDefault={handleRegister}>
		<TextInput
			id="username"
			label="Username"
			type="text"
			bind:value={username}
			required
		/>

		<TextInput
			id="password"
			label="Password"
			type="password"
			bind:value={password}
			required
		/>

		<TextInput
			id="password-confirm"
			label="Confirm Password"
			type="password"
			bind:value={passwordConfirm}
			required
		/>

		<TextInput
			id="registration-otc"
			label="Registration OTC"
			type="text"
			helpButton={otcHelp}
			bind:value={registrationOTC}
			required
		/>

		<CheckboxInput
			id="legal-confirm"
			labelSlot={legalConfirm}
			bind:checked={legalConfirmChecked}
			required
		/>

		<br/>

		<Alert message={error} type="error" />

		<Button type="submit" disabled={loading}>
			{loading ? 'Loading...' : 'Register'}
		</Button>
	</form>

	<p class="link">
		Already have an account? <a href="/login">Login</a>
	</p>
</div>

{#snippet legalConfirm()}
	<p style="font-size: 0.9rem;">
		By registering, you agree to the <a href="/legal/terms-of-service" target="_blank">Terms of Service</a> and <a href="/legal/privacy-policy" target="_blank">Privacy Policy</a>.
	</p>
{/snippet}

{#snippet otcHelp()}
	<HelpButton title="What is a Registration OTC?">
		<p>This is a closed community. For you to be a member, you need to be invited in.</p>
		<p>Someone has to provide to you a valid registration One Time Code (OTC).</p>
	</HelpButton>
{/snippet}

<style>
	.auth-card {
		width: 100%;
		max-width: 400px;
		padding: 2rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background-color: var(--color-bg-main);
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

	a {
		color: var(--color-link);
		text-decoration: underline;
	}

	form{
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>