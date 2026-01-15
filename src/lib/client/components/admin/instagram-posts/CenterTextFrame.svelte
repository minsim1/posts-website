<script lang='ts'>
    import type { SanitizedPost } from "$lib/api/types";
    import Post from "../../posts/Post.svelte";
    import GenericInstagramFrame from "./GenericInstagramFrame.svelte";

    let {
        frameId,
        text,
        scale = 1,
    } : {
        frameId?: string;
        text: string
        scale?: number;
    } = $props();
</script>

<GenericInstagramFrame frameId={frameId} addBottomFader={false} scale={scale}>
    <h1>{text}</h1>
</GenericInstagramFrame>

<style>
    h1{
        color: var(--color-primary);
        width: 100%;
        height: 100%;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
    }
</style>