<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import ContentContainer from "$lib/client/components/general/ContentContainer.svelte";
	import CenterCard from "$lib/client/components/general/CenterCard.svelte";
	import ReturnToPageLink from "../../../lib/client/components/general/ReturnToPage/ReturnToPageLink.svelte";
	import Post from "$lib/client/components/posts/Post.svelte";
	import LoadingIcon from "$lib/client/components/icons/LoadingIcon.svelte";
	import LocalStorageHelper from "$lib/client/helpers/local-storage";
	import { API } from "$lib/api/api";
	import { ErrorCode, type SanitizedPost } from "$lib/api/types";
	import { STRINGS } from "$lib/client/strings/main";
	import { LogOut } from "$lib/helpers/logout";
	import Switch from "$lib/client/components/inputs/Switch.svelte";
	import HelpButton from "$lib/client/components/general/HelpButton.svelte";
    import SmartReturnLink from "$lib/client/components/general/ReturnToPage/SmartReturnLink.svelte";

	interface UserData {
		id: string;
		username: string;
		role: 'admin' | 'user' | 'moderator';
	}

	let postId = $state<string | null>(null);
	let post = $state<SanitizedPost | null>(null);
	let loading = $state(true);
	let error = $state("");
	let user = $state<UserData | null>(null);
	let hidePersonalIcons = $state(true);

	async function loadUserData() {
		const userData = await LocalStorageHelper.GetUserData();
		if (userData) {
			user = userData;
		}
	}

	async function loadPost() {
		if (!postId) {
			error = "Invalid post ID";
			loading = false;
			return;
		}

		loading = true;
		error = "";

		const response = await API.posts.getById(postId);
		loading = false;

		if (response.success) {
			post = response.data.post;
		} else {
			if (response.status === 401 || response.status === 403) {
				await LogOut();
				return;
			}

			if (response.error) {
				if (response.error.code === ErrorCode.Posts.POST_NOT_FOUND) {
					error = "Post not found. It may have been deleted or the link is incorrect.";
					return;
				}

				error = STRINGS.errors[response.error.code] || STRINGS.generic.unknownError;
				return;
			} else {
				error = STRINGS.generic.unknownError + ` (${response.status})`;
			}
		}
	}

	async function handlePostRefresh() {
		await loadPost();
	}

    async function handlePostDeletion(){
        goto("/home");
    }

	$effect(() => {
		const id = $page.params.postId;
		if (id) {
			postId = id;
			loadPost();
		} else {
			error = "Invalid post ID";
			loading = false;
		}
	});

	onMount(async () => {
		await loadUserData();
	});
</script>

<svelte:head>
	<title>{post ? `Post by ${post.authorName}` : 'Post'}</title>
</svelte:head>

{#if loading}
	<ContentContainer>
        <ReturnToPageLink href="/home" text="Return to home" />
		<div class="loading-container">
			<LoadingIcon size={48} />
			<p>Loading post...</p>
		</div>
	</ContentContainer>
{:else if error}
	<CenterCard>
		{#snippet children()}
			<div class="error-container">
                <SmartReturnLink />
				<h2>Error</h2>
				<p class="error-message">{error}</p>
			</div>
		{/snippet}
	</CenterCard>
{:else if post}
	<ContentContainer>
        <div class="top-bar-container">
            <div class="redirect-container">
                <SmartReturnLink />
            </div>
            <div class="show-personal-container">
                <Switch 
                    label="Privacy"
                    bind:checked={hidePersonalIcons}
                    helpComponent={personalIconsExplainer}
                />
            </div>
        </div>
        <div class="post-container">
            <Post 
                {post} 
                showRedirect={false}
                hidePersonalIcons={hidePersonalIcons}
                showModerationRedirect={user ? user.role === "moderator" || user.role === "admin" : false}
                refreshPostsCallback={handlePostRefresh}
                onDeleteCallback={handlePostDeletion}
                autoOpenComments={true}
            />
        </div>
	</ContentContainer>
{/if}

{#snippet personalIconsExplainer()}
    <HelpButton title="What is privacy mode?">
        <p>When browsing in public, the "delete post" button can reveal which anonymous posts are yours.</p>
        <p>Use this option to hide those personal icons</p>
    </HelpButton>
{/snippet}

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem;
		color: var(--color-text-secondary);
	}

    .top-bar-container{
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 1rem;
    }

    .redirect-container{
        flex: 1;
    }

    .show-personal-container{
        flex: 1;
        display: flex;
        justify-content: flex-end;
    }

    .post-container{
        width: 100%;
    }

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
		text-align: center;
	}

	.error-container h2 {
		color: var(--color-error-text);
		margin: 0;
		font-size: 1.5rem;
	}

	.error-message {
		color: var(--color-text);
		margin: 0;
		line-height: 1.6;
	}
</style>
