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
		gap: 0.75rem;
	}

	.group-label {
		color: var(--color-text-main);
		font-weight: 500;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.radio-group {
		display: flex;
		gap: 0.25rem;
		background-color: var(--color-bg-light);
		border-radius: 8px;
		padding: 4px;
		/* box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1); */
	}

	.radio-option {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		transition: all 0.2s ease;
		position: relative;
		background-color: var(--color-bg-light);
	}

	.radio-option:has(input[type="radio"]:checked) {
		background-color: var(--color-bg-main);
		/* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); */
	}

	.radio-option:not(:has(input[type="radio"]:checked)):hover {
		background-color: var(--color-bg-main);
	}

	.radio-option input[type="radio"] {
		position: absolute;
		opacity: 0;
		cursor: pointer;
		width: 100%;
		height: 100%;
		margin: 0;
	}

	.radio-option span {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		user-select: none;
		transition: color 0.2s ease;
		pointer-events: none;
	}

	.radio-option:has(input[type="radio"]:checked) span {
		color: var(--color-text);
		font-weight: 600;
	}

	@media (max-width: 600px) {
		.radio-option{
			padding: 0.4rem 0.75rem;
		}
	}
</style>
