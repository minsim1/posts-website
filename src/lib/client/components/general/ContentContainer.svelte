<div class="container">
    <div class="content">
        <slot />
    </div>
</div>

<style>
    .container{
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        flex: 1;
    }
    .content{
        align-items: center;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--color-border);
        border-left: 1px solid var(--color-border);
        background-color: var(--color-bg-main);
        width: 100%;
        max-width: 800px;
        flex: 1;
    }
</style>