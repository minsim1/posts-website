<script lang='ts'>
    import { type SanitizedUser, type SanitizedComment } from "$lib/api/types";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { onMount } from "svelte";
    import Comment from "./Comment.svelte";
    import CreateComment from "./CreateComment.svelte";
    import { CONFIG } from "../../../../../public-config";
    import Button from "../../inputs/Button.svelte";

    let user = $state<SanitizedUser | null>(null);

    async function loadUserData() {
        user = await LocalStorageHelper.GetUserData();
    }

    onMount(async () => {
        await loadUserData();
    });

    let { 
        comments = $bindable([]),
        showModerationRedirect = false,
        initialCommentNumShowOverride,
        hidePersonalIcons = false,
        postId,
        allowCommentCreation = true,
        returnLocation = "",
        commentCreatedCallback,
        commentDeletedCallback,
        refreshPostsCallback = () => {},
        instagramMode = false
    }: { 
        comments: SanitizedComment[];
        showModerationRedirect: boolean;
        initialCommentNumShowOverride?: number;
        hidePersonalIcons: boolean;
        postId: string;
        allowCommentCreation?: boolean;
        returnLocation?: string;
        commentCreatedCallback?: () => void;
        commentDeletedCallback: () => void;
        refreshPostsCallback?: () => void;
        instagramMode?: boolean;
    } = $props();

    // svelte-ignore state_referenced_locally
        let numOfCommentToShow = $state(initialCommentNumShowOverride ?? CONFIG.comments.initialCountToShow);
    let allCommentsAreShown = $derived(
        numOfCommentToShow >= comments.length
    );

    function showMorePressed(){
        numOfCommentToShow += CONFIG.comments.showMoreIncrement;
    }

    let commentsToShow = $derived(
        comments.slice(0, numOfCommentToShow)
    );
</script>

<div class="container">
    {#each commentsToShow as comment, index}
        <Comment 
            {comment}
            first={index == 0}
            last={index == commentsToShow.length - 1}
            showModerationRedirect={showModerationRedirect}
            hidePersonalIcons={hidePersonalIcons}
            postId={postId}
            deletedCallback={commentDeletedCallback}
            instagramMode={instagramMode}
            returnLocation={returnLocation}
        />
    {/each}
    {#if !allCommentsAreShown && !instagramMode}
        <div class="show-more-button-container">
            <div class="show-more-button">
                <button onclick={showMorePressed}>Show more comments</button>
                <!-- <Button variant="secondary" on:click={showMorePressed}>Show More Comments</Button> -->
            </div>
        </div>
    {/if}
    {#if user && allowCommentCreation && !instagramMode}
        <CreateComment
            postId={postId}
            updateCallback={commentCreatedCallback}
            refreshPostsCallback={refreshPostsCallback}
        />
    {/if}
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
    }

    .show-more-button-container{
        display: flex;
        justify-content: center;
    }

    .show-more-button{
        max-width: 200px;
    }

    button{
        width: 100%;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        background-color: transparent;
        border: none;
        color: var(--color-link);
        cursor: pointer;
    }

    button:hover{
        color: var(--color-link-hover);
        text-decoration: underline;
    }

    @media (max-width: 600px) {
        button{
            font-size: 0.9rem;
        }
    }
</style>