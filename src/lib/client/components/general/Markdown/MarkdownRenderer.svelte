<script lang='ts'>
    import { marked } from 'marked'
    import DOMPurify from 'dompurify';

    let {
        content
    } : {
        content: string
    } = $props();

    let renderHtml = $state("");

    $effect(()=>{
        parseMarkdown(content).then((html)=>{
            renderHtml = html;
        });
    })

    async function parseMarkdown(content: string){
        marked.setOptions({
            breaks: true,
            gfm: true,
            
        });

        const rawHtml = await marked.parse(content);
        return DOMPurify.sanitize(rawHtml);
    }
</script>

{#if renderHtml}
    <div class="markdown-renderer">
        {@html renderHtml}
    </div>
{/if}

<style>
    div.markdown-renderer :global(ul), div.markdown-renderer :global(ol){
        padding-left: 2rem;
    }
    div.markdown-renderer :global(h1), div.markdown-renderer :global(h2){
        padding-top: 1rem;
    }
</style>