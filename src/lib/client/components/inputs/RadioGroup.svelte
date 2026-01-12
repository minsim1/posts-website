<script lang='ts'>
	let {
		label = '',
		name,
		options,
		value = $bindable(),
		onchange = () => {}
	}: {
		label?: string;
		name: string;
		options: { value: string; label: string }[];
		value: string;
		onchange?: () => void;
	} = $props();
</script>

<div class="radio-group-container">
	{#if label}
		<span class="group-label">{label}</span>
	{/if}
	<div class="radio-group">
		{#each options as option}
			<label class="radio-option">
				<input 
					type="radio" 
					{name}
					value={option.value}
					bind:group={value}
					{onchange}
				/>
				<span>{option.label}</span>
			</label>
		{/each}
	</div>
</div>

<style>
	.radio-group-container {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.group-label {
		color: var(--color-text);
		font-weight: 500;
		font-size: 1rem;
	}

	.radio-group {
		display: flex;
		gap: 1rem;
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		border-radius: 8px;
		transition: background-color 0.2s;
	}

	.radio-option:hover {
		background-color: var(--color-bg-secondary);
	}

	.radio-option input[type="radio"] {
		cursor: pointer;
		width: 18px;
		height: 18px;
		accent-color: var(--color-primary);
	}

	.radio-option span {
		color: var(--color-text);
		font-size: 0.95rem;
		user-select: none;
	}
</style>
