<script lang="ts">
	import LoginForm from "$lib/client/components/forms/LoginForm.svelte";
    import PostWallBackdrop from "$lib/client/components/general/PostWallBackdrop.svelte";
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<PostWallBackdrop />

<div class="container">
	<LoginForm />
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		flex: 1;
	}
</style>
