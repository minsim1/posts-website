<script lang="ts">
    import { goto } from "$app/navigation";
    import type { SanitizedUser } from "$lib/api/types";
    import PostWallBackdrop from "$lib/client/components/general/PostWallBackdrop.svelte";
    import InstagramIcon from "$lib/client/components/icons/InstagramIcon.svelte";
    import Button from "$lib/client/components/inputs/Button.svelte";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { STRINGS } from "$lib/client/strings/main";
    import { onMount } from "svelte";
	import { env } from '$env/dynamic/public';

	let userProfile = $state<SanitizedUser | null>(null);

	const instagramUserHandle = env.PUBLIC_INSTAGRAM_HANDLE;
	const followSlogan = "Follow on instagram!";

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

	function instagramPressed(){
		const url = `https://www.instagram.com/${instagramUserHandle}`;
		window.location.href = url;
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
		<button class="instagram-container" onclick={instagramPressed}>
			<div class="instagram-icon-container">
				<InstagramIcon size={"100%"}/>
			</div>
			<p>
				{followSlogan}
			</p>
		</button>
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
		padding: 1rem;
		border-radius: 8px;
		max-width: 600px;
	}
	h1{
		text-align: center;
		text-shadow: black 5px 5px 2px;
	}
	.buttons-container{
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1.5rem;
	}

	.instagram-container{
		display: flex;
		justify-content: center;
		margin-top: 2rem;
		background-color: transparent;
		width: fit-content;
		border: none;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem;
		align-self: center;
		color: var(--color-text);
		font-size: 1.7rem;
		transition: all 0.2s ease;
		scale: 1;
		font-weight: bold;
	}

	.instagram-container p{
		--instagram-color-1: #f09433;
		--instagram-color-2: #e6683c;
		--instagram-color-3: #dc2743;
		--instagram-color-4: #cc2366;
		background: linear-gradient(to right, var(--instagram-color-1), var(--instagram-color-2), var(--instagram-color-3), var(--instagram-color-4));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		position: relative;
		text-align: left;
		width: min-content;
	}

	.instagram-icon-container{
		height: 60px;
		filter: brightness(0.9);
	}

	@media (hover: hover) {
		.instagram-container:hover{
			cursor: pointer;
			scale: 1.05;
		}
	}
</style>
