<script lang='ts'>
	import type { Component, Snippet } from 'svelte';
	import ChevronDownIcon from '../icons/ChevronDownIcon.svelte';

	let {
		windows
	}: {
		windows: Array<{
			title: string;
			content: Snippet;
		}>;
	} = $props();

	let selectedIndex = $state(0);
	let isMobileMenuOpen = $state(false);

	function selectWindow(index: number) {
		selectedIndex = index;
		isMobileMenuOpen = false;
	}
</script>

<div class="windowed-layout">
	<!-- Mobile dropdown -->
	<div class="mobile-selector">
		<button 
			class="dropdown-button" 
			onclick={() => isMobileMenuOpen = !isMobileMenuOpen}
			aria-label="Toggle window selector"
		>
			<span>{windows[selectedIndex]?.title}</span>
			<div class="dropdown-arrow" class:open={isMobileMenuOpen}>
				<ChevronDownIcon />
			</div>
		</button>
		{#if isMobileMenuOpen}
			<div class="dropdown-menu">
				{#each windows as window, index}
					<button
						class="dropdown-item"
						class:active={selectedIndex === index}
						onclick={() => selectWindow(index)}
					>
						{window.title}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Desktop sidebar -->
	<div class="desktop-sidebar">
		{#each windows as window, index}
			<button
				class="sidebar-item"
				class:active={selectedIndex === index}
				onclick={() => selectWindow(index)}
			>
				{window.title}
			</button>
		{/each}
	</div>

	<!-- Content area -->
	<div class="content-area">
		{#if windows[selectedIndex]}
			{@render windows[selectedIndex].content()}
		{/if}
	</div>
</div>

<style>
	.windowed-layout {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
        flex: 1;
	}

	/* Mobile styles */
	.mobile-selector {
		display: block;
		position: relative;
		width: 100%;
		z-index: 10;
	}

	.dropdown-button {
		width: 100%;
		padding: 1rem;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		color: var(--color-text);
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: background-color 0.2s;
	}

	.dropdown-button:hover {
		background-color: var(--color-bg-main);
	}

	.dropdown-arrow {
		display: flex;
		transition: transform 0.2s;
	}

	.dropdown-arrow.open {
		transform: rotate(180deg);
	}

	.dropdown-arrow :global(svg) {
		width: 24px;
		height: 24px;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-top: none;
		max-height: 300px;
		overflow-y: auto;
	}

	.dropdown-item {
		width: 100%;
		padding: 1rem;
		background: none;
		border: none;
		color: var(--color-text);
		font-size: 1rem;
		cursor: pointer;
		text-align: left;
		background-color: var(--color-bg-main);
		transition: background-color 0.2s;
		border-bottom: 1px solid var(--color-border-light);
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.dropdown-item:hover {
		background-color: var(--color-bg-main);
	}

	.dropdown-item.active {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	/* Desktop styles */
	.desktop-sidebar {
		display: none;
	}

	.content-area {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
	}

	/* Desktop breakpoint */
	@media (min-width: 768px) {
		.windowed-layout {
			flex-direction: row;
		}

		.mobile-selector {
			display: none;
		}

		.desktop-sidebar {
			display: flex;
			flex-direction: column;
			width: 250px;
			min-width: 250px;
			background-color: var(--color-bg-secondary);
			border-right: 1px solid var(--color-border);
		}

		.sidebar-item {
			padding: 1rem 1.5rem;
			background: none;
			border: none;
			color: var(--color-text);
			font-size: 1rem;
			cursor: pointer;
			text-align: left;
			transition: background-color 0.2s;
			border-bottom: 1px solid var(--color-border-light);
		}

		.sidebar-item:hover {
			background-color: var(--color-bg-main);
		}

		.sidebar-item.active {
			background-color: var(--color-primary);
			color: var(--color-white);
		}

		.content-area {
			padding: 2rem;
		}
	}
</style>
