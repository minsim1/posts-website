<script lang='ts'>
    import type { Snippet } from "svelte";

	let {
		label = '',
		checked = $bindable(false),
		disabled = false,
		onChange = () => {},
		helpComponent
	}: {
		label?: string;
		checked?: boolean;
		disabled?: boolean;
		helpComponent?: Snippet;
		onChange?: (e: any) => void;
	} = $props();
</script>

<div class="switch-container" class:disabled>
	<span class="switch-label">{label} {#if helpComponent}{@render helpComponent()}{/if}</span>
	<label class="switch">
		<input 
			type="checkbox" 
			bind:checked 
			onchange={onChange}
			{disabled}
		/>
		<span class="slider"></span>
	</label>
</div>

<style>
	.switch-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		user-select: none;
	}

	.switch-container.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.switch-label {
		color: var(--color-text);
		font-size: 0.95rem;
	}

	.switch {
		position: relative;
		width: 48px;
		height: 24px;
		cursor: pointer;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-border);
		transition: 0.3s;
		border-radius: 24px;
	}

	.slider:before {
		position: absolute;
		content: "";
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: var(--color-white);
		transition: 0.3s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: var(--color-primary);
	}

	input:checked + .slider:before {
		transform: translateX(24px);
	}

	input:disabled + .slider {
		cursor: not-allowed;
	}
</style>
