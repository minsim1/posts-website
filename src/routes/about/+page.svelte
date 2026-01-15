<script lang='ts'>
	import ContentContainer from '$lib/client/components/general/ContentContainer.svelte';
    import MarkdownFileRenderer from '$lib/client/components/general/Markdown/MarkdownFileRenderer.svelte';
    import ReturnToPageLink from '$lib/client/components/general/ReturnToPageLink.svelte';
    
    interface SelectionButton{
        text: string;
        filePath: string;    
    }

    const selectionButtons: SelectionButton[] = [
        {
            text: "About",
            filePath: "/about/about.md"
        },
        {
            text: "QNA",
            filePath: "/about/qna.md"
        },
        {
            text: "Bug bounty",
            filePath: "/about/bug-bounty.md"
        },
    ];

    let activeSectionIndex = $state(0);

    function setNewActiveIndex(index: number){
        activeSectionIndex = index;
    }
</script>

<svelte:head>
	<title>About</title>
</svelte:head>

<ContentContainer>
    <ReturnToPageLink href='/home' text="Return to Home"/>
    <div class="button-container">
        {#each selectionButtons as button, index}
            <button 
                class="section-button {index === activeSectionIndex ? 'active' : ''}" 
                onclick={() => setNewActiveIndex(index)}
            >
                {button.text}
            </button>
        {/each}
    </div>
    <div class="md-container">
        <MarkdownFileRenderer filePath={selectionButtons[activeSectionIndex].filePath} />
    </div>
</ContentContainer>

<style>
    .button-container{
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
        gap: 1.5rem;
    }

    .md-container{
        display: block;
        width: 100%;
        padding: 1rem;
    }

    .section-button{
        background-color: transparent;
        font-size: 1.5rem;
        border: none;
        color: var(--color-text);
        position: relative;
        cursor: pointer;
        transition: all 0.3s;
        width: max-content;
    }

    .section-button.active{
        color: var(--color-primary);
    }

    .section-button.active::before{
        background-color: var(--color-primary);
    }

    .section-button::before{
        content: '';
        width: 80%;
        height: 2px;
        background-color: white;
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        transition: all 0.3s;
    }

    .section-button:hover::before{
        width: 100%;
    }

    .section-button.active::before{
        width: 100%;
    }

    @media (max-width: 600px) {
        .section-button{
            font-size: 1.2rem;
        }
    }
</style>
