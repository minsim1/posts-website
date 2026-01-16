<script lang='ts'>
    import ContentContainer from "../ContentContainer.svelte";
    import ReturnToPageLink from "../ReturnToPage/ReturnToPageLink.svelte";
    import SmartReturnLink from "../ReturnToPage/SmartReturnLink.svelte";
    import MarkdownFileRenderer from "./MarkdownFileRenderer.svelte";

    let {
        mdFilePath
    } : {
        mdFilePath: string
    } = $props();
</script>

<ContentContainer>
    <SmartReturnLink />
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