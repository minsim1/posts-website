<script lang='ts'>
    import { API } from "$lib/api/api";
    import type { SanitizedPost } from "$lib/api/types";
    import { onMount } from "svelte";
    import TimeInput from "../../inputs/TimeInput.svelte";
    import { STRINGS } from "$lib/client/strings/main";
    import Button from "../../inputs/Button.svelte";
    import LoadingIcon from "../../icons/LoadingIcon.svelte";
    import Alert from "../../Alert.svelte";
    import GenericInstagramFrame from "./GenericInstagramFrame.svelte";
    import PostInstagramFrame from "./PostInstagramFrame.svelte";
    import * as htmlToImage from "html-to-image";
    import CenterTextFrame from "./CenterTextFrame.svelte";
    import TextInput from "../../inputs/TextInput.svelte";
    import Switch from "../../inputs/Switch.svelte";
    import { CONFIG } from "../../../../../public-config";
    import Modal from "../../Modal.svelte";
    import ProgressBar from "../../ProgressBar.svelte";
    import { showNotification } from "$lib/client/stores/notifications";

    let posts = $state<SanitizedPost[] | null>(null);
    let loading = $state(false);
    let error = $state('');

    // Query parameters
    let range = $state<number>(7 * 24 * 60 * 60 * 1000); // Default to 7 days

    // Content control parameters
    let maxNumOfImages = $state<string>("10")
    let autoReaddPosts = $state<boolean>(true);
    let leaveTheBestForLast = $state<boolean>(true);
        
    let postIdsToIgnore = $state<string[]>([]);

    // Content
    type InstagramImageContent = {
        type: "text",
        text: string
    } | {
        type: "post",
        topText?: string,
        post: SanitizedPost
    }
    let instagramImages = $derived(updateInstagramImages(posts, maxNumOfImages, leaveTheBestForLast, postIdsToIgnore));
    let activeInstagramImageIndex = $state<number>(0);

    // * This solution kinda eats RAM, but it's the easiest way to ensure the images are consistent during upload
    // image index -> data url
    let lockedInImageUrls = $state<Record<number, string>>({});

    // Modals
    let finalReviewModalOpen = $state(false);
    let uploadingStageModalOpen = $state(false);

    // Uploading stage variables
    type UploadingStatus = {
        type: "uploading_image",
        currentImageIndex: number,
        totalImages: number
    } | {
        type: "creating_carousel_post",
        totalImages: number
    } | {
        type: "success"
    } | {
        type: "failure",
        errorMessage: string
    }

    let uploadingStatus = $state<UploadingStatus | null>(null);

    function clearPostsToIgnore(){
        postIdsToIgnore = [];
    }

    function addPostIdToIgnore(postId: string){
        if(postIdsToIgnore.includes(postId)) return;
        postIdsToIgnore.push(postId);
    }

    async function lockInImageUrl(imageIndex: number, frameId: string){
        if(lockedInImageUrls[imageIndex]){
            showNotification('info', 'Image already locked in.');
            return;
        }

        const url = await getDataUrlForFrame(frameId);
        if(!url){
            showNotification('error', 'Could not lock in image.');
            return;
        }
        lockedInImageUrls[imageIndex] = url;
    }

    function updateInstagramImages(
        posts: SanitizedPost[] | null,
        maxNumOfImages: string,
        leaveTheBestForLast: boolean,
        postIdsToIgnoreSet: string[]
    ): InstagramImageContent[] {

        if(!posts){
            return [];
        }

        if(!maxNumOfImages || isNaN(parseInt(maxNumOfImages)) || parseInt(maxNumOfImages) <= 0){
            error = "Max number of images must be a positive number.";
            return [];
        }

        let maxNumberOfImages = parseInt(maxNumOfImages);

        if(!posts || posts.length == 0){
            return [];
        }

        let sortedPosts: SanitizedPost[] = [];
        // Sort posts by score first, then by creation date
        sortedPosts = posts.slice()
        .filter(post => !postIdsToIgnoreSet.includes(post.postId))
        .sort((a, b) => {
            if(a.score === b.score){
                return b.createdAt - a.createdAt; // Newer posts first (If scores are equal)
            }
            return b.score - a.score; // Higher score first
        });

        if(sortedPosts.length == 0){
            return [];
        }

        if(leaveTheBestForLast){
            // Extract highest score posts
            let highestScore = sortedPosts[0].score;
            let highestScorePosts = sortedPosts.filter(p => p.score === highestScore);
            let remainingPosts = sortedPosts.filter(p => p.score !== highestScore);

            // See if at least 2 posts that are not the highest rated can fit in the beginning
            // Keep in mind that in this mode, before the best posts there is a text image
            const requiredImageCountForHighestScorePosts = highestScorePosts.length + 1; // +1 for the text image
            const canFit2NonHighestPosts = 
                (remainingPosts.length >= 2) && 
                (requiredImageCountForHighestScorePosts + 2 <= maxNumberOfImages);
            if(!canFit2NonHighestPosts){
                // Just use sorted posts as is
                return sortedPosts.slice(0, parseInt(maxNumOfImages)).map(post => {
                    return {type: "post", post};
                });
            }else{
                // Show the worse images first, then the best ones at the end
                const numOfNonHighestPostsToShow = Math.min(remainingPosts.length, maxNumberOfImages - requiredImageCountForHighestScorePosts);
                let tempInstagramImages: InstagramImageContent[] = [];
                let beginningPosts: InstagramImageContent[] = 
                    remainingPosts
                    .slice(0, numOfNonHighestPostsToShow)
                    .reverse() // Show worse posts first
                    .map(post => {
                        return {type: "post", post};
                    });
                tempInstagramImages = beginningPosts;
                tempInstagramImages.push({type: "text", text: CONFIG.instagram.images.bestForLastImageText});
                let endingPosts: InstagramImageContent[] = highestScorePosts
                    .slice(0, maxNumberOfImages - tempInstagramImages.length)
                    .reverse() // Show best posts last
                    .map(post => {
                        return {type: "post", post, topText: CONFIG.instagram.images.bestPostTopText};
                    });
                tempInstagramImages = tempInstagramImages.concat(endingPosts);
                return tempInstagramImages;
            }
        }else{
            // Just use sorted posts as is
            return sortedPosts.slice(0, parseInt(maxNumOfImages)).map(post => {
                return {type: "post", post};
            });
        }
    }

    async function fetchPosts(){
        error = "";

        loading = true;
        const response = await API.posts.query(Date.now() - range, Date.now());
        loading = false;

        if(response.success == true){
            posts = response.data.posts;
            activeInstagramImageIndex = 0;
            return;
        }else{
            if(response.status == 401 || response.status == 403){
                window.location.href = "/login"
                return;
            }

            if(response.error){
                error = STRINGS.errors[response.error.code]
                return;
            }else{
                error = STRINGS.generic.unknownError + ` (${response.status})`
            }
        }
    }

    function goToFinalReview(){
        finalReviewModalOpen = true;
        uploadingStageModalOpen = false;
        activeInstagramImageIndex = 0;
    }

    function goToCreatePostStage(){
        finalReviewModalOpen = false;
        uploadingStageModalOpen = true;
        createPost();
    }

    async function createPost(){
        // Upload images
        let containerIds: string[] = [];

        for(const [index, image] of instagramImages.entries()){
            uploadingStatus = {
                type: "uploading_image",
                currentImageIndex: index,
                totalImages: instagramImages.length
            };
            
            const dataUrl = lockedInImageUrls[index] 
            if(!dataUrl){
                uploadingStatus = {
                    type: "failure",
                    errorMessage: "Could not get image for upload."
                };
                return;
            }

            const formData = new FormData();
            try{
                const blob = await (await fetch(dataUrl)).blob()
                formData.append('image', blob, 'instagram-post.png');
            }catch(e){
                console.error(e);
                uploadingStatus = {
                    type: "failure",
                    errorMessage: "Could not prepare image for upload."
                };
                return;
            }

            const response = await API.admin.instagramPosts.uploadImage(formData);
            if(response.success){
                containerIds.push(response.data.containerId);
            }else{
                uploadingStatus = {
                    type: "failure",
                    errorMessage: `Image upload failed. (${response.status})`
                };
                return;
            }
        }

        // Create post
        uploadingStatus = {
            type: "creating_carousel_post",
            totalImages: instagramImages.length
        };

        const response = await API.admin.instagramPosts.createPost(containerIds, CONFIG.instagram.images.carouselCaptionText);
        if(!response.success){
            uploadingStatus = {
                type: "failure",
                errorMessage: `Could not create Instagram post. (${response.status})`
            };
            return;
        }else{
            // Success
            uploadingStatus = {
                type: "success",
            };
        }
    }

    async function getDataUrlForFrame(frameId: string): Promise<string | null>{
        try{
            const frameElement = document.getElementById(frameId);
            const url = await htmlToImage.toJpeg(frameElement!);
            return url;
        }catch(e){
            console.error(e);
            return null;
        }
    }

    function finalReviewClosed(){
        activeInstagramImageIndex = 0;
        lockedInImageUrls = {}
    }

    function uploadStageClosed(){
        activeInstagramImageIndex = 0;
        lockedInImageUrls = {}
    }

    // async function downloadPostImage(frameId: string){
    //     const dataUrl = await getDataUrlForFrame(frameId);
    //     if(!dataUrl){
    //         alert("Could not generate image for post.");
    //         return;
    //     }

    //     const link = document.createElement('a');
    //     link.download = 'instagram-post.png';
    //     link.href = dataUrl;
    //     link.click();
    // }

    // async function uploadPostImage(frameId: string){
    //     const dataUrl = await getDataUrlForFrame(frameId);
    //     if(!dataUrl){
    //         alert("Could not generate image for post.");
    //         return;
    //     }

    //     // Upload logic here
    //     const formData = new FormData();
    //     const blob = await (await fetch(dataUrl)).blob();
    //     formData.append('image', blob, 'instagram-post.png');

    //     const res = await API.admin.instagramPosts.uploadImage(formData);
    //     if(res.success){
    //         alert("Image uploaded successfully.");
    //     }else{
    //         alert("Image upload failed.");
    //     }
    // }

    onMount(()=>{
        fetchPosts();
    });
</script>

<div class="container">
    <h1>Instagram Post Management</h1>
    <h2>Query</h2>
    <div class="query-input-container">
        <div class="time-input-container">
            <TimeInput label="Max post age" id="max-post-age" bind:value={range}/>
        </div>
        <Button on:click={fetchPosts}>Fetch posts</Button>
    </div>
    {#if posts}
        <p>Fetched {posts.length} posts.</p>
    {/if}

    <hr/>

    <h2>Content control</h2>

    <TextInput type="number" label="Max number of images" id="max-num-of-images" bind:value={maxNumOfImages}/>
    <Switch label="Auto re-add posts to carousel" bind:checked={autoReaddPosts}/>
    <Switch label="Leave the best for last" bind:checked={leaveTheBestForLast}/>
    Num of posts to ignore: {postIdsToIgnore.length}
    <Button variant="secondary" on:click={clearPostsToIgnore}>Clear posts to ignore</Button>

    <hr/>

    {#if loading}
        <LoadingIcon />
    {:else if error}
        <Alert type="error" message={error} />
    {:else if activeInstagramImageIndex == 0 && instagramImages.length == 0}
        <p>No instagram images to show...</p>
    {:else if instagramImages.length <= activeInstagramImageIndex}
        <p>No more instagram images to show or the index is incorrect.</p>
    {:else}
        {@render showChangeableImageByIndex(activeInstagramImageIndex, true)}
        <hr/>
        <Button variant="primary" on:click={goToFinalReview} disabled={instagramImages.length < 2 || instagramImages.length > 10}>Go to final review</Button>
    {/if}
</div>

{#snippet showChangeableImageByIndex(index: number, allowToRemoveFromSelection: boolean = true)}
    Post number {activeInstagramImageIndex + 1} of {instagramImages.length}
    {@const image = instagramImages[index]}
    {#if !image}
        <p>Could not load image.</p>
    {:else}
        {@render showImage(image, `instagram-image-${index}`)}
        <div class="image-navigation-buttons">
            <Button variant="secondary" disabled={activeInstagramImageIndex === 0} on:click={()=>{
                activeInstagramImageIndex = Math.max(0, activeInstagramImageIndex - 1);
            }}>Previous Image</Button>
            <Button variant="secondary" disabled={activeInstagramImageIndex === instagramImages.length - 1} on:click={()=>{
                activeInstagramImageIndex = activeInstagramImageIndex + 1;
            }}>Next Image</Button>
        </div>
        {#if image.type == "post" && allowToRemoveFromSelection}
            <Button variant="secondary" on:click={()=>{
                addPostIdToIgnore(image.post.postId);
                activeInstagramImageIndex = Math.max(Math.min(instagramImages.length - 1, activeInstagramImageIndex), 0);
            }}>Remove post from selection</Button>
        {/if}
    {/if}
{/snippet}

{#snippet showImage(instagramImage: InstagramImageContent, id: string)}
    {#key instagramImage}
        {#if instagramImage.type == "text"}
            <CenterTextFrame text={instagramImage.text} frameId={id} />
        {:else if instagramImage.type == "post"}
            <PostInstagramFrame post={instagramImage.post} titleText={instagramImage.topText} frameId={id} />
        {/if}
    {/key}
{/snippet}

<Modal bind:isOpen={finalReviewModalOpen} title="Final Review" onClose={finalReviewClosed}>
    <div class="container">
        {@render showChangeableImageByIndex(activeInstagramImageIndex, false)}
        <Button variant="secondary" on:click={()=>{
            lockInImageUrl(activeInstagramImageIndex, `instagram-image-${activeInstagramImageIndex}`);
        }} disabled={lockedInImageUrls[activeInstagramImageIndex] != null}>Lock in image</Button>
        <Button disabled={Object.keys(lockedInImageUrls).length !== instagramImages.length} variant="primary" on:click={goToCreatePostStage}>Create instagram post</Button>
    </div>
</Modal>

<Modal bind:isOpen={uploadingStageModalOpen} title="Creating Instagram Post" onClose={uploadStageClosed}>
    <div class="container">
        {#if uploadingStatus == null}
            <p>Preparing to upload...</p>
        {:else if uploadingStatus.type == "uploading_image"}
            <h2 class="uploading-state-text">Uploading image {uploadingStatus.currentImageIndex + 1} / {uploadingStatus.totalImages}</h2>
            <ProgressBar 
                currentStep={uploadingStatus.currentImageIndex + 1} 
                totalSteps={uploadingStatus.totalImages + 1 + 1} 
            />
        {:else if uploadingStatus.type == "creating_carousel_post"}
            <h2 class="uploading-state-text">Creating carousel post on Instagram...</h2>
            <ProgressBar 
                currentStep={uploadingStatus.totalImages + 1} 
                totalSteps={uploadingStatus.totalImages + 1 + 1} 
            />
        {:else if uploadingStatus.type == "success"}
            <Alert type="success" message="Instagram post created successfully!" />
        {:else if uploadingStatus.type == "failure"}
            <Alert type="error" message={"Failed to create Instagram post: " + uploadingStatus.errorMessage} />
        {/if}
    </div>
</Modal>

<style>
    .container{
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .query-input-container{
        display: flex;
        align-items: end;
        width: 100%;
        flex-direction: row;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .query-input-container .time-input-container{
        min-width: fit-content;
    }

    .image-navigation-buttons{
        display: flex;
        flex-direction: row;
        gap: 1rem;
    }

    .uploading-state-text{
        text-align: center;
    }

</style>