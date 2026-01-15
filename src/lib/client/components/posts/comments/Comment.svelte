<script lang='ts'>
    import { type SanitizedConfig, type SanitizedComment, ErrorCode } from "$lib/api/types";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { GetApprxTimeDifferenceString, GetDateTimeString } from "$lib/client/helpers/time";
    import { onMount } from "svelte";
    import ContentAuthor from "../../general/TextWithRoleColorBackground.svelte";
    import ContentActionButtons from "../ContentActionButtons.svelte";
    import DynamicTimeText from "../../general/DynamicTimeText.svelte";
    import DeleteContentConfirm from "../DeleteContentConfirm.svelte";
    import { API } from "$lib/api/api";
    import { LogOut } from "$lib/helpers/logout";
    import { showNotification } from "$lib/client/stores/notifications";
    import { STRINGS } from "$lib/client/strings/main";
    import { goto } from "$app/navigation";

    const DECORATION_WIDTH = "20px";

    let { 
        comment = $bindable(),
        postId,
        last,
        first,
        showModerationRedirect = false,
        showRedirect = false,
        hidePersonalIcons = false,
        deletedCallback,
        instagramMode = false
    }: { 
        comment: SanitizedComment;
        postId: string;
        last: boolean;
        first: boolean;
        showModerationRedirect: boolean;
        showRedirect?: boolean;
        hidePersonalIcons: boolean;
        deletedCallback: () => void;
        instagramMode?: boolean;
    } = $props();

    let config = $state<SanitizedConfig | null>(null);
    let deleteModalOpen = $state(false);
    let deleteLoading = $state(false);
    let canDelete = $derived(
        config ? config.limits.maxCommentAgeToAllowDelete + comment.createdAt > Date.now() : true
    );
    let showModeration = $derived(showModerationRedirect && canDelete);
    let showDelete = $derived(comment.belongsToCurrentUser && !hidePersonalIcons && canDelete);
    let atLeastOneIconVisible = $derived(
        showModeration || showDelete || showRedirect
    );

    function handleDeleteClick(){
        deleteModalOpen = true;
    }

    async function handleDeleteConfirm(){
        deleteLoading = true;
        const response = await API.comments.delete(postId, comment.commentId);
        deleteLoading = false;
        deleteModalOpen = false;

        if(response.success){
            showNotification('success','Comment deleted successfully.');
            deletedCallback();
        }else{
            LocalStorageHelper.ClearUserDataCache();
            LocalStorageHelper.ClearServerConfigCache();
            if(response.status == 401){
                await LogOut();
                return;
            }

            if(response.error){
                if(response.error.code == ErrorCode.Comments.COMMENT_TOO_OLD_TO_DELETE){
                    showNotification('error','This comment is too old to be deleted.');
                    LocalStorageHelper.ClearServerConfigCache();
                    deletedCallback();
                    return;
                }

                if(response.status == 403){
                    await LogOut();
                    return;
                }

                if(response.error.code == ErrorCode.User.SUSPENDED){
                    await LogOut();
                    return;
                }

                if(response.error.code == ErrorCode.User.USER_NOT_FOUND){
                    await LogOut();
                    return;
                }

                if(response.error.code == ErrorCode.Comments.COMMENT_NOT_FOUND){
                    // Comment already deleted, call the callback
                    showNotification('error','Comment not found. It may have already been deleted.');
                    deletedCallback();
                    return;
                }

                if(response.error.code == ErrorCode.Posts.POST_NOT_FOUND){
                    showNotification('error','Parent post not found. It may have been deleted.');
                    deletedCallback();
                    return;
                }

                if(response.error.code == ErrorCode.Comments.NON_OWNER_CAN_NOT_DELETE){
                    showNotification('error','You do not have permission to delete this comment.');
                    return;
                }

                showNotification('error',STRINGS.errors[response.error.code]);
            }else{
                showNotification('error',STRINGS.generic.unknownError + ` (${response.status})`);
            }
        }
    }

    function handleModeration(){
        goto(`/moderation/comment?id=${comment.commentId}&postId=${postId}`);
    }

    function handleRedirect(){
        goto(`/posts/${postId}`);
    }

    async function loadConfig(){
        config = await LocalStorageHelper.GetServerConfigData();
    }

    onMount(()=> {
        loadConfig();
    });
</script>

<div class="container">
    <div class="decoration-container" style={`width: ${DECORATION_WIDTH}`}>
        <div class="decoration-dot" class:disabled={!first}></div>
        <div class="decoration-curved-line-container" style={`min-height: ${DECORATION_WIDTH}`}>
            <div class="decoration-curved-line" style={
                `width: calc(${DECORATION_WIDTH} * 2);
                height: calc(${DECORATION_WIDTH} * 2);
                top: -${DECORATION_WIDTH};`
            }></div>
        </div>
        <div class="decoration-line" class:disabled={last}></div>
    </div>
    <div class="comment-container" class:margin-bottom={!atLeastOneIconVisible} style={`padding-top: calc(${DECORATION_WIDTH} - 1.2rem);`}>
        <div class="metadata">
            <ContentAuthor username={comment.authorName} role={comment.authorRole} />
            <p class="timeContainer">
                {#if instagramMode}
                    {GetDateTimeString(comment.createdAt)}
                {:else}
                    <DynamicTimeText timestamp={comment.createdAt} type="time_since"/> ago
                {/if}
            </p>
        </div>
        <div class="content">
            <p>{comment.content}</p>
        </div>
        <ContentActionButtons
            showRedirect={showRedirect}
            showModeration={showModerationRedirect && canDelete}
            showDelete={comment.belongsToCurrentUser && !hidePersonalIcons && canDelete}
            onRedirect={handleRedirect}
            onModerate={handleModeration}
            onDelete={handleDeleteClick}
        />
    </div>
</div>

<DeleteContentConfirm 
    bind:isOpen={deleteModalOpen}
    contentType="comment"
    showLoading={deleteLoading}
    deleteContentCallback={handleDeleteConfirm}
/>

<style>
    .container{
        --line-color: var(--color-border);
        display: flex;
        flex-direction: row;
        min-height: fit-content;
    }

    /* Decoration styles */

    .disabled{
        display: none;
    }

    .decoration-container{
        display: flex;
        flex-direction: column;
        position: relative;
        content: "";
    }

    .decoration-dot{
        z-index: 2;
        content: "";
        background-color: var(--line-color);
        width: 10px;
        height: 10px;
        border-radius: 5px;
        position: absolute;
        top: -5px;
        left: -5px;
    }

    .decoration-curved-line-container{
        overflow: hidden;
        position: relative;
        content: '';
        width: 100%;
    }

    .decoration-line{
        content: "";
        height: 100%;
        position: absolute;
        width: 0;
        border: 1px solid var(--line-color);
    }

    .decoration-curved-line{
        content: "";
        position: absolute;
        border: 2px solid var(--line-color);
        border-radius: 50%;
    }

    /* Comment styles */

    .comment-container{
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        position: relative;
    }

    .comment-container.margin-bottom{
        margin-bottom: 1.5rem;
    }

    .content{
        padding: 0.5rem 1rem;
        font-size: 1.2rem;
        word-wrap: break-word;
        max-width: 100%;
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

    @media (max-width: 600px) {
        .metadata{
            font-size: 0.6rem;
            padding: 0.5rem;
        }

        .content{
            padding: 0.5rem 1rem;
            font-size: 1.1rem;
        }
    }

</style>