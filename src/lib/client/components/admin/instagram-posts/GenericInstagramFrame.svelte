<script lang='ts'>
    let {
        children,
        addBottomFader = true,
        frameId = "",
        titleText = ""
    } : {
        addBottomFader?: boolean,
        children: any,
        frameId?: string
        titleText?: string
    } = $props();
</script>

<div class="container">
    <div class="frame" id={frameId}>
        {#if titleText}
            <h1>{titleText}</h1>
            <hr/>
        {/if}
        {@render children?.()}
        {#if addBottomFader}
            <div class="bottom-fader"></div>
            <div class="bottom-block"></div>
        {/if}
    </div>
</div>



<style>
    h1{
        padding: 0.5rem 1rem;
        color: var(--color-primary);
        width: 100%;
    }

    hr{
        width: 95%;
        border: 1px solid var(--color-border);
    }

    .container{
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--color-border);
    }

    .frame {
        width: 512px;
        height: 512px;
        border: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        overflow: hidden;
        position: relative;
        background-color: var(--color-bg-main);
        pointer-events: none;
    }

    .bottom-fader {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 150px;
        bottom: 25px;
        background: linear-gradient(to bottom, rgba(138, 56, 56, 0), var(--color-bg-main));
    }

    .bottom-block{
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 25px;
        background-color: var(--color-bg-main);
    }
</style>