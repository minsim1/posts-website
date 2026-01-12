<script lang='ts'>
    import CenterCard from "../general/CenterCard.svelte";

    let {
        status
    } : {
        status: number
    } = $props();
</script>

<CenterCard class="error-container">
    <h1>{status} - An Error Occurred</h1>
    <p>Sorry, an unexpected error has occurred.</p>
    <p><a href="/home">Try going back to the home page</a></p>
</CenterCard>

<style>
    h1{
        text-align: center;
    }

    :global(.center-card.error-container){
        display: flex;
        max-width: 400px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>