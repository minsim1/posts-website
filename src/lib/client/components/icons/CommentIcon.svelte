<script lang="ts">
	// Comment/chat bubble icon
	let {
		size = "24px"
	} : {
		size?: string;
	} = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
	<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
</svg>

<style>
	svg {
		display: block;
	}
</style>
