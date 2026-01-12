<script lang='ts'>
    import { type SanitizedPost, type SanitizedComment } from "$lib/api/types";
    import Post from "../posts/Post.svelte";
    import Comment from "../posts/comments/Comment.svelte";

    let {
        data
    }: {
        data: {
            type: "comment";
            item: SanitizedComment;
        } | {
            type: "post";
            item: SanitizedPost;
        }
    } = $props();
</script>

{#if data.type === "post"}
    <div class="content-wrapper post">
        <!-- <span class="type-badge post">Post</span> -->
        <Post 
            post={data.item} 
            showModerationRedirect={true}
            showRedirect={true}
            showComments={false}
            hidePersonalIcons={true}
            autoOpenComments={false}
            refreshPostsCallback={() => {}}
        />
    </div>
{:else}
    <div class="content-wrapper comment">
        <!-- <span class="type-badge comment">Comment</span> -->
        <Comment 
            comment={data.item} 
            postId={data.item.postId}
            first={true}
            last={true}
            showModerationRedirect={true}
            showRedirect={true}
            hidePersonalIcons={true}
            deletedCallback={() => {}}
        />
    </div>
{/if}

<style>
    .content-wrapper {
        position: relative;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background-color: var(--color-bg);
    }

    .content-wrapper.comment {
        padding: 1rem;
    }

    .content-wrapper.post {
        padding: 0rem;
    }

    /* .type-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        z-index: 1;
    }

    .type-badge.post {
        background-color: var(--color-primary);
        color: var(--color-bg);
    }

    .type-badge.comment {
        background-color: var(--color-secondary);
        color: var(--color-bg);
    } */
</style>
