<script lang='ts'>
	import { API } from "$lib/api/api";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { LogOut } from "$lib/helpers/logout";
	import UpArrowIcon from "../icons/UpArrowIcon.svelte";
	import DownArrowIcon from "../icons/DownArrowIcon.svelte";
    import { showNotification } from "$lib/client/stores/notifications";
    import { ErrorCode } from "$lib/api/types";
    import { STRINGS } from "$lib/client/strings/main";

	let {
		postId,
		currentVote = $bindable(),
		score = $bindable(),
		refreshCallback = () => {},
		instagramMode = false
	}: {
		postId: string;
		currentVote: "upvote" | "downvote" | null;
		score: number;
		refreshCallback?: () => void;
		instagramMode?: boolean;
	} = $props();

	let isProcessing = $state(false);

	async function handleVote(voteType: "upvote" | "downvote") {
		if (isProcessing) return;

        const user = await LocalStorageHelper.GetUserData();
        if(!user){
            LogOut();
            return;
        }

		// Determine the new vote state
		const newVote = currentVote === voteType ? null : voteType;
		const oldVote = currentVote;
		const oldScore = score;

		// Optimistically update UI
		if (oldVote === "upvote" && newVote === null) {
			score -= 1;
		} else if (oldVote === "downvote" && newVote === null) {
			score += 1;
		} else if (oldVote === null && newVote === "upvote") {
			score += 1;
		} else if (oldVote === null && newVote === "downvote") {
			score -= 1;
		} else if (oldVote === "upvote" && newVote === "downvote") {
			score -= 2;
		} else if (oldVote === "downvote" && newVote === "upvote") {
			score += 2;
		}
		currentVote = newVote;

		isProcessing = true;
		const response = await API.posts.setVote(postId, newVote == null ? "remove_vote" : newVote);
		isProcessing = false;

		if (response.success) {
			currentVote = response.data.newVote;
            score = response.data.newScore;
		} else {
			// Revert optimistic update
			currentVote = oldVote;
			score = oldScore;

			LocalStorageHelper.ClearUserDataCache();
			LocalStorageHelper.ClearServerConfigCache();

			if(response.status == 401 || response.status == 403){
				await LogOut();
				return;
			}

			if(response.error){
				if(response.error.code == ErrorCode.Posts.POST_NOT_FOUND){
					if(refreshCallback){
						refreshCallback();
					}else{
						showNotification('error',"The post you are trying to vote on no longer exists.");
					}
				}

				if(response.error.code == ErrorCode.Votes.VOTING_VIOLATES_LIMIT_RULES){
					showNotification('error',"You are voting too frequently. Try again later.");
					return;
				}

				if(response.error.code == ErrorCode.User.SUSPENDED){
					await LogOut();
					return;
				}

				showNotification('error',STRINGS.errors[response.error.code]);
			}else{
				showNotification('error',STRINGS.generic.unknownError + ` (${response.status})`);
			}
		}
	}
</script>

<div class="vote-section">
	<button
		class="vote-button upvote"
		class:active={currentVote === "upvote" || instagramMode}
		onclick={() => handleVote("upvote")}
		aria-label="Upvote"
		disabled={isProcessing}
	>
		<UpArrowIcon />
	</button>
	<span class="vote-count">{score}</span>
	<button
		class="vote-button downvote"
		class:active={currentVote === "downvote" && !instagramMode}
		onclick={() => handleVote("downvote")}
		aria-label="Downvote"
		disabled={isProcessing}
	>
		<DownArrowIcon />
	</button>
</div>

<style>
	.vote-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding-top: 0.5rem;
	}

	.vote-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-vote-neutral);
		transition: color 0.2s, transform 0.1s;
	}

	.vote-button:disabled {
		cursor: default;
	}

	.vote-button :global(svg) {
		width: 24px;
		height: 24px;
	}

	@media (hover: hover) {
		.vote-button.upvote:hover:not(:disabled) {
			color: var(--color-upvote-hover);
			transform: translateY(-2px);
		}

		.vote-button.downvote:hover:not(:disabled) {
			color: var(--color-downvote-hover);
			transform: translateY(2px);
		}
	}

	.vote-button.upvote.active {
		color: var(--color-upvote);
	}

	.vote-button.upvote:active:not(:disabled) {
		transform: translateY(0);
	}

	.vote-button.downvote.active {
		color: var(--color-downvote);
	}

	.vote-button.downvote:active:not(:disabled) {
		transform: translateY(0);
	}

	.vote-count {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		min-width: 30px;
		text-align: center;
	}
</style>
