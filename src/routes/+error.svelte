<script lang='ts'>
    import { page } from '$app/state';
    import Error404 from '$lib/client/components/errors/Error404.svelte';
    import ErrorGeneric from '$lib/client/components/errors/ErrorGeneric.svelte';
</script>

{#if page.status === 404}
    <Error404 />
{:else}
    <ErrorGeneric status={page.status} />
{/if}