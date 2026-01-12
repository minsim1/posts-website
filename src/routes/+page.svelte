<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		window.location.href = '/login';
	});
</script>

<svelte:head>
	<title>Redirecting...</title>
</svelte:head>

<div class="container">
	<p>Redirecting to login...</p>
</div>

<style>
	.container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
