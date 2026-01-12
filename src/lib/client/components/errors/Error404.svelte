<script lang='ts'>
    import CenterCard from "../general/CenterCard.svelte";
</script>

<CenterCard class="error-404-container">
    <h1>¯\(ツ)/¯</h1>
    <h2>404</h2>
    <p>The page you are looking for does not exist :/</p>
    <p><a href="/home">Try going back to the home page</a></p>
</CenterCard>

<style>
    h1, h2{
        text-align: center;
    }

    :global(.center-card.error-404-container){
        display: flex;
        max-width: 400px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>