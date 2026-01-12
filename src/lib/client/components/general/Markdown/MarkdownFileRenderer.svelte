<script lang='ts'>
    import { marked } from 'marked'
    import DOMPurify from 'dompurify';
    import MarkdownRenderer from './MarkdownRenderer.svelte';

    let {
        filePath
    } : {
        filePath: string
    } = $props();

    let content = $state("");

    $effect(()=>{
        fetchFileContents(filePath).then((text)=>{
            content = text;
        });
    })

    async function fetchFileContents(filePath: string){
        try{
            const response = await fetch(filePath);
            if(response.ok){
                return await response.text();
            }else{
                return "";
            }
        }catch(error){
            return "";
        }
    }
</script>

{#if content}
    <MarkdownRenderer {content} />
{/if}