<script lang="ts">
    import { goto } from "$app/navigation";
    import type { SanitizedUser } from "$lib/api/types";
    import PostWallBackdrop from "$lib/client/components/general/PostWallBackdrop.svelte";
    import Button from "$lib/client/components/inputs/Button.svelte";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { STRINGS } from "$lib/client/strings/main";
    import { onMount } from "svelte";

	let userProfile = $state<SanitizedUser | null>(null);

	async function loadUserProfile(){
		userProfile = await LocalStorageHelper.GetUserData();
	}

	function explorePressed(){
		goto('/home');
	}

	function createPostPressed(){
		if(!userProfile){
			goto('/login');
			return;
		}

		goto('/home');
	}

	function getRandomWelcomeMessage(): string {
		if(STRINGS.generic.mainPage.welcomeMessages.length == 0){
			return "Welcome!";
		}

		const randomIndex = Math.floor(Math.random() * STRINGS.generic.mainPage.welcomeMessages.length);
		return STRINGS.generic.mainPage.welcomeMessages[randomIndex];
	}

	onMount( async () => {
		await loadUserProfile();
	});
</script>

<svelte:head>
	<title>Welcome!</title>
</svelte:head>

<PostWallBackdrop/>

<div class="container">
	<div class="content">
		<h1>{getRandomWelcomeMessage()}</h1>
		<div class="buttons-container">
			<Button
				variant="secondary"
				on:click={explorePressed}
			>{STRINGS.generic.mainPage.buttons.explorePosts}</Button>
			<Button
				variant="secondary"
				on:click={createPostPressed}
			>{STRINGS.generic.mainPage.buttons.createPost}</Button>
		</div>
	</div>
</div>

<style>
	.container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.content{
		display: flex;
		flex-direction: column;
		/* background-color: var(--color-bg-main); */
		padding: 1rem;
		border-radius: 8px;
		max-width: 600px;
	}
	h1{
		text-align: center;
		text-shadow: black 5px 5px 10px;
	}
	.buttons-container{
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1.5rem;
	}
</style>
