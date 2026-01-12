<script lang="ts">
    let {
        size = 24
    }: {
        size?: number;
    } = $props();
</script>

<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10" opacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
</svg>

<style>
    svg {
        display: block;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
