<div class="container">
    <div class="overlay"></div>
    <slot />
</div>

<style>
    .container {
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background-color: var(--color-bg-light);
        user-select: none;
        position: relative;
    }
    .overlay{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0);
        z-index: 10;
    }
</style>
