<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/client/components/Footer.svelte';
    import Header from '$lib/client/components/Header.svelte';
	import Notifications from '$lib/client/components/Notifications.svelte';
    import JwtRefreshHeartbeat from '$lib/client/components/general/JwtRefreshHeartbeat.svelte';

	let { children } = $props();
</script>

<!-- <svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head> -->

<div class="app-layout">
	<JwtRefreshHeartbeat />
	<Header />
	<main class="main-content">
		{@render children()}
	</main>
	<Footer />
	<Notifications />
</div>

<style>
	.app-layout {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.main-content {
		flex: 1 0 auto;
		display: flex;
		height: 100%;
		flex-direction: column;
	}
</style>
