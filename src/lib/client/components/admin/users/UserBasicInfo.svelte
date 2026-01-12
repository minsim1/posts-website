<script lang="ts">
	import DynamicTimeText from "../../general/DynamicTimeText.svelte";
	import TextWithRoleColorBackground from "../../general/TextWithRoleColorBackground.svelte";

	let {
		id,
		username,
		role,
		canChangeUsername,
	}: {
		id: string;
		username: string;
		role: 'admin' | 'user' | 'moderator';
		canChangeUsername: boolean;
	} = $props();
</script>

<section class="section basic-user-info">
	<h2>Basic Information</h2>
	<div class="info-item">
		<span class="label">ID:</span>
		<span class="value">{id}</span>
	</div>
	<div class="info-item">
		<span class="label">Username:</span>
		<span class="value">
			<b>{username}</b>
			<TextWithRoleColorBackground username={role} role={role} />
		</span>
	</div>
	<div class="info-item">
		<span class="label">Can change username:</span>
		<span class="value">{canChangeUsername ? 'Yes' : 'No'}</span>
	</div>
</section>

<style>
	.section {
		background-color: var(--color-bg-main);
		padding: 1.5rem;
		border-radius: 8px;
	}

	.basic-user-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h2 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
		font-size: 1.25rem;
	}

	.info-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.label {
		color: var(--color-text-secondary);
		font-weight: 600;
		font-size: 0.9rem;
		min-width: 180px;
	}

	.value {
		color: var(--color-text);
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
</style>
