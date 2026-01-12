<script lang="ts">
	import RegisterForm from "$lib/client/components/forms/RegisterForm.svelte";
</script>

<svelte:head>
	<title>Register</title>
</svelte:head>

<div class="container">
	<RegisterForm />
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
