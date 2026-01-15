<script lang='ts'>
    import { marked } from 'marked'
    import DOMPurify from 'dompurify';
    import MarkdownRenderer from './MarkdownRenderer.svelte';
    import LoadingIcon from '../../icons/LoadingIcon.svelte';

    let {
        filePath
    } : {
        filePath: string
    } = $props();

    let content = $state("");
    let loading = $state(true);

    $effect(()=>{
        fetchFileContents(filePath).then((text)=>{
            content = text;
        });
    })

    async function fetchFileContents(filePath: string){
        try{
            content = "";
            loading = true;
            const response = await fetch(filePath);
            loading = false;
            if(response.ok){
                return await response.text();
            }else{
                return "";
            }
        }catch(error){
            loading = false;
            return "";
        }
    }
</script>

{#if content}
    <MarkdownRenderer {content} />
{/if}

{#if loading}
    <div class="loading-container">
        <LoadingIcon size={48} />
    </div>
{/if}

<style>
    .loading-container{
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px;
    }
</style>