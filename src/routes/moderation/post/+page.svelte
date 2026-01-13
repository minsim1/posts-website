<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import LocalStorageHelper from "$lib/client/helpers/local-storage";
	import ContentContainer from "$lib/client/components/general/ContentContainer.svelte";
	import Button from "$lib/client/components/inputs/Button.svelte";
	import LoadingIcon from "$lib/client/components/icons/LoadingIcon.svelte";
	import SuspensionSelect, { type SuspensionData } from "$lib/client/components/moderation/SuspensionSelect.svelte";
    import { ErrorCode, type SanitizedPost } from "$lib/api/types";
    import { API } from "$lib/api/api";
    import { LogOut } from "$lib/helpers/logout";
    import { STRINGS } from "$lib/client/strings/main";
    import Post from "$lib/client/components/posts/Post.svelte";
	import UntouchableContentContainer from "$lib/client/components/moderation/UntouchableContentContainer.svelte";
    import DeleteContentConfirm from "$lib/client/components/posts/DeleteContentConfirm.svelte";
    import { showNotification } from "$lib/client/stores/notifications";
	import LastSuspensionCheck from "$lib/client/components/moderation/LastSuspensionCheck.svelte";
	import CenterCard from "$lib/client/components/general/CenterCard.svelte";
    import ReturnToPageLink from "$lib/client/components/general/ReturnToPageLink.svelte";

	
	interface UserData {
		id: string;
		username: string;
		role: 'admin' | 'user' | 'moderator';
	}

	let user = $state<UserData | null>(null);
	let postId = $state<string | null>(null);
	let error = $state("");
	let success = $state("");	
	let loading = $state(true);
	let post = $state<SanitizedPost | null>(null);
	let deleteModalOpen = $state(false);
	let deleteLoading = $state(false);

	let applySuspension = $state(false);
	let suspensionData = $state<SuspensionData>({ reason: "", duration: null });

	async function loadUserData(): Promise<boolean> {
		const userData = await LocalStorageHelper.GetUserData();
		
		if (!userData) {
			goto('/home');
			return false;
		}

		if (userData.role !== 'moderator' && userData.role !== 'admin') {
			goto('/home');
			return false;
		}

		user = userData;
		return true;
	}

	function checkUrlParams(): boolean {
		const urlParams = new URLSearchParams(window.location.search);
		const id = urlParams.get('id');

		if (!id) {
			error = "The page URL is malformed. Please check the link and try again.";
			return false;
		}

		postId = id;
		return true;
	}

	async function loadPost(){
		loading = true;
		const response = await API.posts.getById(postId!);
		loading = false;

		if(response.success){
			post = response.data.post;
		}else{
			if(response.status == 401 || response.status == 403){
				return LogOut();
			}

			if(response.error){
				if(response.error.code == ErrorCode.Posts.POST_NOT_FOUND){
					error = "The post you are trying to moderate does not exist.";
					return;
				}

				//TODO: handle more errors
				error = STRINGS.errors[response.error.code];
				return;
			}else{
				error = STRINGS.generic.unknownError + ` (${response.status})`;
			}
		}
	}

	onMount(async () => {
		const userValid = await loadUserData();
		if (!userValid) return;

		const urlValid = checkUrlParams();	
		if (!urlValid) return;

		await loadPost();
		loading = false;
	});

	function handleReturnHome() {
		goto('/home');
	}

	function handleDelete(){
		deleteModalOpen = true;
	}

	async function handleDeleteConfirm(){
		deleteLoading = true;
		const response = await API.posts.delete(
			postId!,
			applySuspension ? {
				reason: suspensionData.reason,
				duration: suspensionData.duration
			} : undefined
		)
		deleteLoading = false;
		deleteModalOpen = false;

		if(response.success){
			// Post was deleted
			success = "Post deleted successfully.";
			if(response.data.suspensionStatus){
				if(response.data.suspensionStatus == "applied"){
					success += " The user has been suspended.";
				}else if(response.data.suspensionStatus == "not_applied_new_is_shorter"){
					success += " The user was not suspended because they have a longer or equal suspension already active.";
				}
			}
		}else{
			if(response.error){
				if(response.error.code == ErrorCode.User.SUSPENDED){
					await LogOut();
					return;
				}

				if(response.error.code == ErrorCode.User.USER_NOT_FOUND){
					showNotification('error', "The user you're trying to suspend no longer exists. Try to just delete the post and not apply a suspension.")
					return;
				}

				if(response.error.code == ErrorCode.Posts.POST_NOT_FOUND){
					error = "The post you are trying to delete no longer exists.";
					return;
				}

				if(response.error.code == ErrorCode.Posts.NON_OWNER_CAN_NOT_DELETE){
					await LogOut();
					return;
				}

				if(response.error.code == ErrorCode.Posts.POST_TOO_OLD_TO_DELETE){
					LocalStorageHelper.ClearServerConfigCache();
					error = "This post is too old to be deleted.";
					return;
				}

				if(response.error.code == ErrorCode.Moderation.UNAUTHORIZED_DELETION){
					error = "You are not allowed to delete this post.";
					return;
				}

				if(response.error.code == ErrorCode.Moderation.UNAUTHORIZED_SUSPENSION){
					error = "You are not allowed to suspend this user.";
					return;
				}

				error = STRINGS.errors[response.error.code];
				return;
			}else{
				error = STRINGS.generic.unknownError + ` (${response.status})`;
			}
		}
	}

</script>

<svelte:head>
	<title>Post Moderation</title>
</svelte:head>

{#if loading}
	<CenterCard>
		<div class="loading-container">
			<LoadingIcon />
		</div>
	</CenterCard>
{:else if error}
	<CenterCard class="error-card">
		<ReturnToPageLink href="/home" text="Return to home" />
		<h2>There was an error</h2>
		<p>{error}</p>
	</CenterCard>
{:else if success}
	<CenterCard>
		<ReturnToPageLink href="/home" text="Return to home" />
		<h2>Success</h2>
		<p>{success}</p>
	</CenterCard>
{:else if post}
	<CenterCard>
		<ReturnToPageLink href="/home" text="Return to home" />
		<h2>Moderate Post</h2>
		<UntouchableContentContainer>
			<Post
				post={post}
				refreshPostsCallback={() => {}}
				autoOpenComments={false}
				showModerationRedirect={false}
				hidePersonalIcons={true}
			/>
		</UntouchableContentContainer>
		<div class="suspension-section">
			<SuspensionSelect 
				bind:applySuspension
				bind:suspensionData
			/>
		</div>
		<LastSuspensionCheck 
			type="post"
			id={postId!}
		/>
		<Button type="button" on:click={handleDelete} variant="danger">
			Delete {applySuspension ? "and Suspend User" : ""}
		</Button>
	</CenterCard>
{/if}

{#if deleteModalOpen}
	<DeleteContentConfirm
		bind:isOpen={deleteModalOpen}
		contentType="post"
		deleteContentCallback={handleDeleteConfirm}
		showLoading={deleteLoading}
	/>
{/if}


<style>
	.loading-container {
		width: 4rem;
		height: 4rem;
		margin: 0 auto;
	}

	:global(.error-card) {
		text-align: center;
	}

	:global(.error-card) h2 {
		color: var(--color-error);
		margin-bottom: 1rem;
	}

	:global(.error-card) p {
		color: var(--color-text);
		margin-bottom: 1.5rem;
	}

	h2 {
		color: var(--color-text);
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.suspension-section {
		margin-top: 1.5rem;
	}


	p{
		text-align: center;
	}
</style>
