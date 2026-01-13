<script lang="ts">
    import { goto } from "$app/navigation";
	import LoginForm from "$lib/client/components/forms/LoginForm.svelte";
    import PostWallBackdrop from "$lib/client/components/general/PostWallBackdrop.svelte";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { onMount } from "svelte";

	async function handleLoggedInRedirect(){
		const userProfile = await LocalStorageHelper.GetUserData();
		if(userProfile){
			goto("/home");
		}
	}

	onMount(()=>{
		handleLoggedInRedirect();
	})
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<PostWallBackdrop />

<div class="container">
	<LoginForm />
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		flex: 1;
	}
</style>
