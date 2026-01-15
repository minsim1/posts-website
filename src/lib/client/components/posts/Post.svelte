<script lang='ts'>
    import { ErrorCode, type SanitizedComment, type SanitizedConfig, type SanitizedPost, type SanitizedUser } from "$lib/api/types";
    import { GetApprxTimeDifferenceString, GetDateTimeString } from "$lib/client/helpers/time";
    import { onMount } from "svelte";
    import Vote from "./Vote.svelte";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { goto } from "$app/navigation";
    import Comments from "./comments/Comments.svelte";
    import ContentAuthor from "../general/TextWithRoleColorBackground.svelte";
    import ContentActionButtons from "./ContentActionButtons.svelte";
    import { API } from '$lib/api/api';
    import { LogOut } from '$lib/helpers/logout';
    import DynamicTimeText from "../general/DynamicTimeText.svelte";
    import LoadingIcon from "../icons/LoadingIcon.svelte";
    import DeleteContentConfirm from "./DeleteContentConfirm.svelte";
    import { showNotification } from "$lib/client/stores/notifications";
    import { STRINGS } from "$lib/client/strings/main";

    let { 
        post = $bindable(),
        hidePersonalIcons = false,
        showModerationRedirect = false,
        showRedirect = true,
        refreshPostsCallback = () => {},
        onDeleteCallback = () => {},
        autoOpenComments = true,
        showComments = true,
        instagramMode = false,
        forceComments = [],
        allowedToComment = true,
        initialCommentNumShowOverride,
    }: { 
        post: SanitizedPost;
        initialCommentNumShowOverride?: number;
        allowedToComment?: boolean;
        forceComments?: SanitizedComment[];
        hidePersonalIcons?: boolean;
        showModerationRedirect?: boolean;
        showRedirect?: boolean;
        refreshPostsCallback: () => void;
        onDeleteCallback?: () => void;
        autoOpenComments?: boolean;
        showComments?: boolean;
        instagramMode?: boolean;
    } = $props();

    let currentVote = $state<"upvote" | "downvote" | null>(null);
    let config = $state<SanitizedConfig | null>(null);
    let score = $state(0);
    let commentsOpen = $state(false);
    let commentsLoading = $state(false);
    let loadedComments = $state<SanitizedComment[]>([]);
    let commentsInitiallyLoaded = $state(false);
    let canDelete = $derived(
        config ? config.limits.maxPostAgeToAllowDelete + post.createdAt > Date.now() : true
    );
    let canCommentOn = $derived(
        config ? config.limits.maxPostAgeToComment + post.createdAt > Date.now() && allowedToComment : false
    );

    let deleteModalOpen = $state(false);
    let deleteLoading = $state(false);

    async function loadConfig(){
        config = await LocalStorageHelper.GetServerConfigData();
    }

    $effect(() => {
        currentVote = post.personalUserVote || null;
        score = post.score;
        if(post.commentsCount > 0 && !commentsInitiallyLoaded && autoOpenComments){
            commentsInitiallyLoaded = true;
            fetchCommentsAndOpen();
        }
    });

    function handleDeleteClick(){
        deleteModalOpen = true;
    }

    async function handleDeleteConfirm(){
        deleteLoading = true;
        const response = await API.posts.delete(post.postId);
        deleteLoading = false;
        deleteModalOpen = false;

        if(response.success){
            showNotification('success','Post deleted successfully.');
            refreshPostsCallback();
            onDeleteCallback();
        }else{
            LocalStorageHelper.ClearUserDataCache();
            LocalStorageHelper.ClearServerConfigCache();
            if(response.error){
                if(response.error.code == ErrorCode.User.SUSPENDED){
                    await LogOut();
                    return;
                }

                if(response.error.code == ErrorCode.Posts.POST_TOO_OLD_TO_DELETE){
                    showNotification('error','This post is too old to be deleted.');
                    LocalStorageHelper.ClearServerConfigCache();
                    return;
                }

                if(response.error.code == ErrorCode.User.USER_NOT_FOUND){
                    await LogOut();
                    return;
                }

                if(response.error.code == ErrorCode.Posts.POST_NOT_FOUND){
                    // Post already deleted, call the callback
                    showNotification('error','Post not found. It may have already been deleted.');
                    refreshPostsCallback();
                    return;
                }

                if(response.error.code == ErrorCode.Posts.NON_OWNER_CAN_NOT_DELETE){
                    showNotification('error','You are not allowed to delete this post.');
                    return;
                }

                showNotification('error', STRINGS.generic.unknownError)
            }else{
                showNotification('error', STRINGS.generic.unknownError)
            }
        }
    }

    function handleModeration(){
        goto(`/moderation/post?id=${post.postId}`);
    }

    function handleRedirect(){
        goto(`/posts/${post.postId}`);
    }

    function handleVoteRefreshCallback(){
        // Refresh post data
        refreshPostsCallback();
    }

    async function fetchCommentsAndOpen(){
        if(commentsLoading) return;
        if(forceComments && forceComments.length > 0){
            loadedComments = forceComments;
            commentsOpen = true;
            return;
        }

        commentsLoading = true;
        const response = await API.comments.getByPostId(post.postId);
        commentsLoading = false;
        if(response.success){
            loadedComments = response.data.comments.sort((a, b) => a.createdAt - b.createdAt);
            post.commentsCount = loadedComments.length;
        }else{
            if(response.status == 401 || response.status == 403){
                await LogOut();
                return;
            }

            if(response.error){
                if(response.error.code == ErrorCode.User.SUSPENDED){
                    await LogOut();
                    return;
                }

                showNotification('error','An error occured while loading comments: ' + STRINGS.errors[response.error.code]);
            }else{
                showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
            }
        }
        
        commentsOpen = true;
    }

    async function handleCommentCreation(){
        post.commentsCount += 1;
        if(post.commentsCount < 0) post.commentsCount = 0; // Idk how that would happen, but just in case
        fetchCommentsAndOpen();
    }

    async function handleCommentDeletion(){
        post.commentsCount -= 1;
        if(post.commentsCount < 0) post.commentsCount = 0;
        fetchCommentsAndOpen();
    }

    async function handleCommentsToggle(){
        if(commentsOpen == false){
            await fetchCommentsAndOpen();
        }else{
            commentsOpen = false;
        }
    }

    onMount(async () => {
        await loadConfig();
    });
</script>

<div class="container">
    <div class="vote-and-post">
        <div class="vote-section">
            <Vote postId={post.postId} bind:currentVote bind:score refreshCallback={handleVoteRefreshCallback} instagramMode={instagramMode} />
        </div>
        <div class="post-content">
            <div class="metadata">
                <ContentAuthor username={post.authorName} role={post.authorRole} />
                <p class="timeContainer">
                    {#if instagramMode}
                        {GetDateTimeString(post.createdAt)}
                    {:else}
                        <DynamicTimeText timestamp={post.createdAt} type="time_since"/> ago
                    {/if}
                </p>
            </div>
            <div class="content">
                <p>{post.content}</p>
            </div>
            <div class="action-buttons-container">
                <ContentActionButtons
                    showComments={(post.commentsCount > 0 || canCommentOn) && showComments}
                    commentsCount={post.commentsCount}
                    showRedirect={showRedirect}
                    showModeration={showModerationRedirect && canDelete}
                    showDelete={post.belongsToCurrentUser && !hidePersonalIcons && canDelete}
                    onComments={handleCommentsToggle}
                    onRedirect={handleRedirect}
                    onModerate={handleModeration}
                    onDelete={handleDeleteClick}
                />
            </div>
        </div>
    </div>

    {#if commentsLoading}
        <div class="loading-container">
            <LoadingIcon/>
        </div>
    {:else if commentsOpen}
        <div class="comments">
            <Comments
                comments={loadedComments}
                initialCommentNumShowOverride={initialCommentNumShowOverride}
                allowCommentCreation={canCommentOn}
                showModerationRedirect={showModerationRedirect}
                hidePersonalIcons={hidePersonalIcons}
                postId={post.postId}
                commentCreatedCallback={handleCommentCreation}
                commentDeletedCallback={handleCommentDeletion}
                refreshPostsCallback={refreshPostsCallback}
                instagramMode={instagramMode}
            />
        </div>
    {/if}
</div>

<DeleteContentConfirm 
    bind:isOpen={deleteModalOpen}
    contentType="post"
    showLoading={deleteLoading}
    deleteContentCallback={handleDeleteConfirm}
/>

<style>
    .container{
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }

    .vote-and-post{
        display: flex;
        flex-direction: row;
    }

    .comments{
        padding-left: 5rem;
    }
    
    .loading-container{
        display: flex;
        justify-content: center;
        align-items: center;
        height: 4rem;
    }

    .post-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        position: relative;
    }

    .content{
        max-width: 100%;
        word-wrap: break-word;
        padding: 0.5rem 1rem;
        font-size: 1.5rem;
    }
    
    .metadata{
        display: flex;
        justify-content: flex-start;
        font-size: 0.8rem;
        padding: 0.5rem;
        
    }

    .timeContainer{
        display: flex;
        padding: 0 0.5rem;
        color: var(--color-text-secondary);
        font-style: italic;
    }

    .action-buttons-container {
        bottom: 0.5rem;
        right: 0.5rem;
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        height: 30px;
    }

    @media (max-width: 600px) {
        .container{
            padding: 0 1rem;
            gap: 0;
        }

        .content{
            padding: 0 0.5rem;
            font-size: 1.3rem;
        }

        .comments{
            padding-left: 3rem;
        }

        .metadata{
            font-size: 0.65rem;
            padding: 0.4rem;
            padding-top: 1rem;
        }

        .vote-section{
            scale: 0.9;
        }

        .action-buttons-container {
            height: 20px;
        }
    }
</style>