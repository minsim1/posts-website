<script lang='ts'>
    import { ErrorCode, type APITypes, type SanitizedConfig, type SanitizedUser } from "$lib/api/types";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { STRINGS } from "$lib/client/strings/main";
    import { CanUserDoInteraction } from "$lib/helpers/rules";
    import { onMount } from "svelte";
    import Alert from "../../Alert.svelte";
    import { GetApprxTimeDifferenceString } from "$lib/client/helpers/time";
	import CreateContentConfirm from "../CreateContentConfirm.svelte";
	import { API } from "$lib/api/api";
	import SendIcon from "../../icons/SendIcon.svelte";
    import { LogOut } from "$lib/helpers/logout";
    import { showNotification } from "$lib/client/stores/notifications";

    let {
        updateCallback = () => {},
        refreshPostsCallback = () => {},
        postId
    }: {
        updateCallback?: () => void,
        refreshPostsCallback?: () => void,
        postId: string
    } = $props();

    let error = $state('');
    let success = $state('');
    let loading = $state(false);

	let commentContent = $state('');
	let textarea: HTMLTextAreaElement;
	let isModalOpen = $state(false);

	let currentUser = $state<SanitizedUser | null>(null);
	let serverConfig = $state<SanitizedConfig | null>(null);
    let postTooOldToCommentOn = $state(false);

    let nextTimestampWhenUserCanComment = $state<number>(0);

    function calculateData(){
        if(!currentUser) return;
        if(!serverConfig) return;

        const canUserComment = CanUserDoInteraction('comment', currentUser.latestInteractions, serverConfig.userInteractionLimits);
        if(!canUserComment.canDoInteraction){
            nextTimestampWhenUserCanComment = canUserComment.timestampWhenCanPost;
        }else{
            nextTimestampWhenUserCanComment = 0;
        }
    }

    async function loadData(){
        currentUser = await LocalStorageHelper.GetUserData();
        serverConfig = await LocalStorageHelper.GetServerConfigData();
        calculateData();
    }

	function adjustHeight() {
		if (textarea) {
			textarea.style.height = 'auto';
			textarea.style.height = textarea.scrollHeight + 'px';
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		commentContent = target.value;
		adjustHeight();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}

	function handleSubmit() {
		// Check if submission is allowed
		if (commentContent.trim().length === 0) return;
		if (serverConfig && commentContent.trim().length > serverConfig.limits.maxCommentLength) return;
		if (nextTimestampWhenUserCanComment > Date.now() && currentUser?.role !== 'admin') return;

		// Blur textarea to hide keyboard on mobile
		if (textarea) {
			textarea.blur();
		}

		// Open modal for confirmation
		isModalOpen = true;
	}

	async function confirmComment(anonymous: boolean) {
        const contentToPost = commentContent.trim()
		commentContent = '';
		adjustHeight();
        error = '';
        success = '';
        
        //TODO: Handle comment creation API call
        loading = true;
		const response = await API.comments.create(postId, contentToPost, anonymous);
        loading = false;
        isModalOpen = false;

        if(response.success){
            LocalStorageHelper.ClearUserDataCache();
            await loadData();
            updateCallback();
            success = 'Comment created successfully!';
            showNotification('success','Comment created successfully.');
            return;
        }else{
            LocalStorageHelper.ClearUserDataCache();
            LocalStorageHelper.ClearServerConfigCache();
            await loadData();

            // if(response.status == 403 || response.status == 401){
            //     await LogOut();
            //     return;
            // }

            if(response.error){
                if(response.error.code === ErrorCode.User.SUSPENDED){
                    await LogOut();
                    return;
                }

                if(response.error.code == ErrorCode.User.USER_NOT_FOUND){
                    await LogOut();
                    return;
                }

                if(response.error.code == ErrorCode.Posts.POST_NOT_FOUND){
                    updateCallback();
                    refreshPostsCallback();
                    showNotification("error", "The post you tried to comment on does not exist anymore.");
                    return;
                }

                console.log("Error creating comment:", response.error);

                error = STRINGS.errors[response.error.code];
                return;
            }else{
                error = STRINGS.generic.unknownError + ` (${response.status})`;
                return;
            }
        }
		
	}

    function GetPlaceholderText(){
        return STRINGS.generic.comments.create.placeholder;
    }

    onMount(()=>{
        loadData();
        adjustHeight();
        const resizeHandler = () => adjustHeight();
        window.addEventListener('resize', resizeHandler);

        return () => {
            window.removeEventListener('resize', resizeHandler);
        };
    })
</script>

<div class="create-comment">
    <textarea
        bind:this={textarea}
        value={commentContent}
        oninput={handleInput}
        onkeydown={handleKeyDown}
        placeholder={GetPlaceholderText()}
        rows="1"
    ></textarea>
    <div class="infoContainer">
        {#if currentUser && serverConfig}
            <p
                class="limit-counter"
                class:exceeded={commentContent.trim().length > serverConfig.limits.maxCommentLength}
            >{commentContent.trim().length} / {serverConfig.limits.maxCommentLength}</p>
        {/if}
        <button 
            aria-label="Send comment"
            onclick={handleSubmit}
            disabled={
            commentContent.trim().length === 0
            || (serverConfig && commentContent.trim().length > serverConfig.limits.maxCommentLength)}>
            <SendIcon />
        </button>
    </div>
    {#if nextTimestampWhenUserCanComment > Date.now()}
        <Alert
            message={`Please wait ${GetApprxTimeDifferenceString(nextTimestampWhenUserCanComment, Date.now())} before creating another comment.`}
            type="error"
        />
    {/if}
    {#if error}
        <Alert
            message={error}
            type="error"
        />
    {/if}
    {#if success}
        <Alert
            message={success}
            type="success"
        />
    {/if}
</div>

<CreateContentConfirm 
	bind:isOpen={isModalOpen}
	contentType="comment"
	createContentCallback={confirmComment}
    showLoading={loading}
/>

<style>
	.create-comment {
        display: flex;
        flex-direction: column;
		width: 100%;
        padding: 1rem 1rem 0 1rem;
        gap: 0.5rem;
	}

    .infoContainer{
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .limit-counter{
        padding-left: 1rem;
        text-align: left;
        font-size: 0.9rem;
        color: var(--color-text-secondary);
        margin-top: 0.25rem;
    }

    .limit-counter.exceeded{
        color: var(--color-error);
    }

    button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background-color: var(--color-primary);
        color: white;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
        padding: 0;
    }

    button:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        transform: scale(1.05);
    }

    button:active:not(:disabled) {
        transform: scale(0.95);
    }

    button:disabled {
        background-color: var(--color-border);
        cursor: not-allowed;
        opacity: 0.5;
    }

    button :global(svg) {
        width: 20px;
        height: 20px;
        transform: rotate(-30deg) translate(2px, 0);
    }

	textarea {
        /* background-color: rgba(107, 12, 12, 0.466); */
		width: 100%;
		min-height: 40px;
		max-height: 500px;
		padding: 12px;
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.5;
        border: 1px solid var(--color-border);
        border-radius: 8px;
		background-color: var(--color-bg-secondary);
		color: var(--color-text);
		resize: none;
		overflow-y: hidden;
		box-sizing: border-box;
		transition: border-color 0.2s;
	}

	textarea:focus {
		outline: none;
		/* border-color: var(--color-primary); */
	}

	textarea::placeholder {
		color: var(--color-text-secondary);
	}
</style>