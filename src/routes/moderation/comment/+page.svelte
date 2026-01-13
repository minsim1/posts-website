<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import LocalStorageHelper from "$lib/client/helpers/local-storage";
	import ContentContainer from "$lib/client/components/general/ContentContainer.svelte";
	import Button from "$lib/client/components/inputs/Button.svelte";
	import LoadingIcon from "$lib/client/components/icons/LoadingIcon.svelte";
	import SuspensionSelect, { type SuspensionData } from "$lib/client/components/moderation/SuspensionSelect.svelte";
	import { ErrorCode, type SanitizedComment, type SanitizedPost } from "$lib/api/types";
	import { API } from "$lib/api/api";
	import { LogOut } from "$lib/helpers/logout";
	import { STRINGS } from "$lib/client/strings/main";
	import Comment from "$lib/client/components/posts/comments/Comment.svelte";
	import UntouchableContentContainer from "$lib/client/components/moderation/UntouchableContentContainer.svelte";
	import DeleteContentConfirm from "$lib/client/components/posts/DeleteContentConfirm.svelte";
	import { showNotification } from "$lib/client/stores/notifications";
	import LastSuspensionCheck from "$lib/client/components/moderation/LastSuspensionCheck.svelte";
	import CenterCard from "$lib/client/components/general/CenterCard.svelte";

	interface UserData {
		id: string;
		username: string;
		role: 'admin' | 'user' | 'moderator';
	}

	let user = $state<UserData | null>(null);
	let commentId = $state<string | null>(null);
	let postId = $state<string | null>(null);
	let error = $state("");
	let success = $state("");
	let loading = $state(true);
	let comment = $state<SanitizedComment | null>(null);
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
		const pId = urlParams.get('postId');

		if (!id || !pId) {
			error = "The page URL is malformed. Please check the link and try again.";
			return false;
		}

		commentId = id;
		postId = pId;
		return true;
	}

	async function loadComment(){
		loading = true;
		
		const commentResponse = await API.comments.getById(commentId!, postId!);
		loading = false;
		
		if(commentResponse.success){
			comment = commentResponse.data.comment;
		}else{
			if(commentResponse.status == 401 || commentResponse.status == 403){
				return LogOut();
			}

			if(commentResponse.error){
				if(commentResponse.error.code == ErrorCode.Comments.COMMENT_NOT_FOUND){
					error = "The comment you are trying to moderate does not exist.";
					return;
				}

				error = STRINGS.errors[commentResponse.error.code];
				return;
			}else{
				error = STRINGS.generic.unknownError + ` (${commentResponse.status})`;
				return;
			}
		}
	}	onMount(async () => {
		const userValid = await loadUserData();
		if (!userValid) return;

		const urlValid = checkUrlParams();	
		if (!urlValid) return;

		await loadComment();
	});

	function handleReturnHome() {
		goto('/home');
	}

	function handleDelete(){
		deleteModalOpen = true;
	}

	async function handleDeleteConfirm(){
		deleteLoading = true;
		const response = await API.comments.delete(
			postId!,
			commentId!,
			applySuspension ? {
				reason: suspensionData.reason,
				duration: suspensionData.duration
			} : undefined
		)
		deleteLoading = false;
		deleteModalOpen = false;

		if(response.success){
			// Comment was deleted
			success = "Comment deleted successfully.";
			if(response.data.suspensionStatus){
				if(response.data.suspensionStatus == "applied"){
					success += " The user has been suspended.";
				}else if(response.data.suspensionStatus == "not_applied_new_is_shorter"){
					success += " The user was not suspended because they have a shorter or equal suspension already active.";
				}
			}
		}else{
			if(response.error){
				if(response.error.code == ErrorCode.User.SUSPENDED){
					await LogOut();
					return;
				}

				if(response.error.code == ErrorCode.User.USER_NOT_FOUND){
					showNotification('error', "The user you're trying to suspend no longer exists. Try to just delete the comment and not apply a suspension.")
					return;
				}

				if(response.error.code == ErrorCode.Comments.COMMENT_NOT_FOUND){
					error = "The comment you are trying to delete no longer exists.";
					return;
				}

				if(response.error.code == ErrorCode.Posts.POST_NOT_FOUND){
					error = "The post for this comment no longer exists.";
					return;
				}

				if(response.error.code == ErrorCode.Comments.NON_OWNER_CAN_NOT_DELETE){
					await LogOut();
					return;
				}

				if(response.error.code == ErrorCode.Comments.COMMENT_TOO_OLD_TO_DELETE){
					LocalStorageHelper.ClearServerConfigCache();
					error = "This comment is too old to be deleted.";
					return;
				}

				if(response.error.code == ErrorCode.Moderation.UNAUTHORIZED_DELETION){
					error = "You are not allowed to delete this comment.";
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
	<title>Comment Moderation</title>
</svelte:head>

{#if loading}
	<CenterCard>
		<div class="loading-container">
			<LoadingIcon />
		</div>
	</CenterCard>
{:else if error}
	<CenterCard class="error-card">
		<h2>There was an error</h2>
		<p>{error}</p>
		<Button type="button" on:click={handleReturnHome}>
			Return to Home
		</Button>
	</CenterCard>
{:else if success}
	<CenterCard>
		<h2>Success</h2>
		<p>{success}</p>
		<Button type="button" on:click={handleReturnHome}>
			Return to Home
		</Button>
	</CenterCard>
{:else if comment}
	<CenterCard>
		<Button type="button" on:click={handleReturnHome} variant="secondary">
			Return to Home
		</Button>
		<h2>Moderate Comment</h2>
		<UntouchableContentContainer>
			<Comment
				comment={comment}
				deletedCallback={() => {}}
				first={true}
				last={true}
				showModerationRedirect={false}
				hidePersonalIcons={true}
				postId={postId!}
			/>
		</UntouchableContentContainer>
		<div class="suspension-section">
			<SuspensionSelect 
				bind:applySuspension
				bind:suspensionData
			/>
		</div>
		<LastSuspensionCheck 
			type="comment"
			id={commentId!}
		/>
		<Button type="button" on:click={handleDelete} variant="danger">
			Delete {applySuspension ? "and Suspend User" : ""}
		</Button>
	</CenterCard>
{/if}

{#if deleteModalOpen}
	<DeleteContentConfirm
		bind:isOpen={deleteModalOpen}
		contentType="comment"
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
</style>
