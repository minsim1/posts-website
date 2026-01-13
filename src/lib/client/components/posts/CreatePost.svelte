<script lang='ts'>
    import { ErrorCode, type APITypes, type SanitizedConfig, type SanitizedUser } from "$lib/api/types";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import { STRINGS } from "$lib/client/strings/main";
    import { CanUserDoInteraction } from "$lib/helpers/rules";
    import { onMount } from "svelte";
    import Alert from "../Alert.svelte";
    import { GetApprxTimeDifferenceString } from "$lib/client/helpers/time";
	import CreateContentConfirm from "./CreateContentConfirm.svelte";
	import { API } from "$lib/api/api";
	import SendIcon from "../icons/SendIcon.svelte";
    import { LogOut } from "$lib/helpers/logout";

    let { updateCallback = () => {} }: { updateCallback?: () => void } = $props();

    let error = $state('');
    let success = $state('');
    let loading = $state(false);

	let postContent = $state('');
	let textarea: HTMLTextAreaElement;
	let isModalOpen = $state(false);

	let currentUser = $state<SanitizedUser | null>(null);
	let serverConfig = $state<SanitizedConfig | null>(null);

    let nextTimestampWhenUserCanPost = $state<number>(0);

    function calculateData(){
        if(!currentUser) return;
        if(!serverConfig) return;

        const canUserPost = CanUserDoInteraction('post', currentUser.latestInteractions, serverConfig.userInteractionLimits);
        if(!canUserPost.canDoInteraction){
            nextTimestampWhenUserCanPost = canUserPost.timestampWhenCanPost;
        }else{
            nextTimestampWhenUserCanPost = 0;
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
		postContent = target.value;
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
		if (postContent.trim().length === 0) return;
		if (serverConfig && postContent.trim().length > serverConfig.limits.maxPostLength) return;
		if (nextTimestampWhenUserCanPost > Date.now() && currentUser?.role !== 'admin') return;

		// Blur textarea to hide keyboard on mobile
		if (textarea) {
			textarea.blur();
		}

		// Open modal for confirmation
		isModalOpen = true;
	}

	async function confirmPost(anonymous: boolean) {
        const contentToPost = postContent.trim()
		postContent = '';
		adjustHeight();
        error = '';
        success = '';
        
        loading = true;
		const response = await API.posts.create(contentToPost, anonymous);
        loading = false;
        isModalOpen = false;

        if(response.success){
            LocalStorageHelper.ClearUserDataCache();
            await loadData();
            updateCallback();
            adjustHeight();
            success = 'Post created successfully!';
            return;
        }else{
            LocalStorageHelper.ClearUserDataCache();
            LocalStorageHelper.ClearServerConfigCache();
            await loadData();

            if(response.error){
                if(response.error.code === ErrorCode.User.SUSPENDED){
                    await LogOut();
                    return;
                }

                if(response.error.code == ErrorCode.User.USER_NOT_FOUND){
                    await LogOut();
                    return;
                }

                error = STRINGS.errors[response.error.code];
                return;
            }else{
                error = STRINGS.generic.unknownError + ` (${response.status})`;
                return;
            }
        }
		
	}

    function GetPlaceholderText(){
        const options = STRINGS.generic.posts.create.placeholderSlogans;
        const randomIndex = Math.floor(Math.random() * options.length);
        return options[randomIndex];
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

<div class="create-post">
	<textarea
		bind:this={textarea}
		value={postContent}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		placeholder={GetPlaceholderText()}
		rows="1"
	></textarea>
    <div class="infoContainer">
        {#if currentUser && serverConfig}
            <p
                class="limit-counter"
                class:exceeded={postContent.trim().length > serverConfig.limits.maxPostLength}
            >{postContent.trim().length} / {serverConfig.limits.maxPostLength}</p>
        {/if}
        <button 
            aria-label="Send post"
            onclick={handleSubmit}
            disabled={
            postContent.trim().length === 0
            || (serverConfig && postContent.trim().length > serverConfig.limits.maxPostLength)}>
            <SendIcon />
        </button>
    </div>
    {#if nextTimestampWhenUserCanPost > Date.now() && currentUser?.role !== 'admin'}
        <Alert
            message={`Please wait ${GetApprxTimeDifferenceString(nextTimestampWhenUserCanPost, Date.now())} before creating another post.`}
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
	contentType="post"
	createContentCallback={confirmPost}
    showLoading={loading}
/>

<style>
	.create-post {
        display: flex;
        flex-direction: column;
		width: 100%;
        padding: 1rem 1rem 0 1rem;
        gap: 1rem;
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
		font-size: 1.5rem;
		line-height: 1.5;
        border: none;
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