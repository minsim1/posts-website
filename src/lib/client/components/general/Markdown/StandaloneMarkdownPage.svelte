<script lang='ts'>
    import ContentContainer from "../ContentContainer.svelte";
    import ReturnToPageLink from "../ReturnToPageLink.svelte";
    import MarkdownFileRenderer from "./MarkdownFileRenderer.svelte";

    let {
        mdFilePath
    } : {
        mdFilePath: string
    } = $props();
</script>

<ContentContainer>
    <ReturnToPageLink text="Return to home page" href="/home"/>
    <div class="md-container">
        <MarkdownFileRenderer filePath={mdFilePath} />
    </div>
</ContentContainer>

<style>
    .md-container{
        display: block;
        padding: 2rem;
    }
</style>