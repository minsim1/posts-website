<script lang='ts'>
    import type { SanitizedPost } from "$lib/api/types";
    import Post from "../../posts/Post.svelte";
    import GenericInstagramFrame from "./GenericInstagramFrame.svelte";

    let {
        post,
        frameId,
        titleText = "",
        scale = 1,
    } : {
        post: SanitizedPost,
        frameId?: string;
        titleText?: string
        scale?: number;
    } = $props();
</script>

<GenericInstagramFrame frameId={frameId} titleText={titleText} scale={scale}>
    <div class="post-container">
        <Post
            post={post}
            refreshPostsCallback={() => {}}
            showRedirect={false}
            instagramMode={true}
            hidePersonalIcons={true}
            initialCommentNumShowOverride={5}
        />
    </div>
</GenericInstagramFrame>

<style>
    .post-container{
        width: 100%;
        height: 100%;
    }   
</style>