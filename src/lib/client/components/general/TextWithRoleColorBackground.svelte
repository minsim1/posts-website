<script lang='ts'>
	import type { UserRole } from "$lib/server/db/types";
	import UserIcon from "../icons/UserIcon.svelte";
	import ShieldIcon from "../icons/ShieldIcon.svelte";
	import CrownIcon from "../icons/CrownIcon.svelte";

	let {
		username,
		role
	}: {
		username: string;
		role: UserRole | "anonymous";
	} = $props();

	function getRoleColor(role: UserRole | "anonymous"): string {
		switch(role) {
			case "admin":
				return "var(--color-admin)";
			case "moderator":
				return "var(--color-moderator)";
			case "user":
			case "anonymous":
			default:
				return "var(--color-user-general)";
		}
	}
</script>

<p class="author-container" style="background-color: {getRoleColor(role)}">
	<span class="username">{username}</span>
	{#if role === "user"}
		<span class="icon">
			<UserIcon />
		</span>
	{:else if role === "moderator"}
		<span class="icon">
			<ShieldIcon />
		</span>
	{:else if role === "admin"}
		<span class="icon">
			<CrownIcon />
		</span>
	{/if}
</p>

<style>
	.author-container {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0 0.5rem;
		border-radius: 10rem;
	}

	.username {
		display: flex;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon :global(svg) {
		width: 14px;
		height: 14px;
	}
</style>
