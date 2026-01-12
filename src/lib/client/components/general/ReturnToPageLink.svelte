<script lang='ts'>
    let {
        text,
        href
    } : {
        text: string;
        href: string;
    } = $props();
</script>

<a href={href} class="return-to-page-link">
    {"<--"} {text}
</a>

<style>
    .return-to-page-link {
        color: var(--color-link);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
        padding: 1rem;
        align-self: flex-start;
    }

    .return-to-page-link:hover {
        text-decoration: underline;
        color: var(--color-link-hover);
    }
</style>