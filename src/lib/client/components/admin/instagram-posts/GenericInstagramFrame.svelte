<script lang='ts'>
    let {
        children,
        addBottomFader = true,
        frameId = "",
        titleText = "",
        scale = 0.5,
    } : {
        addBottomFader?: boolean,
        children: any,
        frameId?: string
        titleText?: string,
        scale?: number
    } = $props();
</script>

<div class="container" style={`width: ${1024 * scale}px; height: ${1024 * scale}px; scale: ${scale};`}>
    <div class="frame" id={frameId}>
        <div class="content">
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
    <div class="container-border" style={`width: ${1024}px; height: ${1024}px;`}></div>
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
        position: relative;
    }

    .container-border{
        position:absolute;
        box-sizing: border-box;
        pointer-events: none;
        border: 2px solid var(--color-border);
    }

    .content{
        width: 50%;
        height: 50%;
        scale: 2;
        translate: 0 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .frame {
        min-width: 1024px;
        min-height: 1024px;
        width: 1024px;
        height: 1024px;
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
        bottom: 20px;
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