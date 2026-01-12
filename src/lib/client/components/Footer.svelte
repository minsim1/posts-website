<script lang="ts">
	import { onMount } from 'svelte';
	import LocalStorageHelper from "$lib/client/helpers/local-storage";
	import { Languages, type Language, DefaultLanguage } from "$lib/client/strings/main";

	const currentYear = new Date().getFullYear();
	let currentLanguage = $state<Language>(DefaultLanguage);

	onMount(() => {
		currentLanguage = LocalStorageHelper.language.get();
	});

	let isOpen = $state(false);

	const languageFlags: Record<Language, string> = {
		'en': '🇬🇧',
		'lt': '🇱🇹'
	};

	function changeLanguage(lang: Language) {
		LocalStorageHelper.language.set(lang);
		currentLanguage = lang;
		isOpen = false;
		// Reload page to apply language changes
		window.location.reload();
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.language-selector')) {
			isOpen = false;
		}
	}

	onMount(() => {
		currentLanguage = LocalStorageHelper.language.get();
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<footer class="footer">
	<div class="footer-content">
		<div class="footer-row">
			<p>&copy; {currentYear} COPYRIGHT PLACEHOLDER</p>
			<!-- <div class="language-selector">
				<button class="lang-dropdown-toggle" onclick={toggleDropdown}>
					{languageFlags[currentLanguage]} {currentLanguage.toUpperCase()}
					<span class="arrow">{isOpen ? '▼' : '▲'}</span>
				</button>
				{#if isOpen}
					<div class="lang-dropdown">
						{#each Languages as lang}
							<button 
								class="lang-option"
								class:active={currentLanguage === lang}
								onclick={() => changeLanguage(lang)}
							>
								{languageFlags[lang]} {lang.toUpperCase()}
							</button>
						{/each}
					</div>
				{/if}
			</div> -->
		</div>
	</div>
</footer>

<style>
	.footer {
		width: 100%;
		padding: 1.5rem 1rem;
		background: var(--color-bg-light);
		border-top: 1px solid var(--color-border);
		margin-top: auto;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.footer-row {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	p {
		margin: 0;
		color: var(--color-text-light);
		font-size: 0.9rem;
	}

	/* .language-selector {
		position: relative;
	}

	.lang-dropdown-toggle {
		padding: 0.4rem 0.8rem;
		background: transparent;
		color: var(--color-text-light);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.lang-dropdown-toggle:hover {
		background: var(--color-bg-light);
		color: var(--color-text);
	}

	.arrow {
		font-size: 0.7rem;
	}

	.lang-dropdown {
		position: absolute;
		bottom: 100%;
		right: 0;
		margin-bottom: 0.5rem;
		background: var(--color-bg-main);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		z-index: 100;
		min-width: 120px;
	}

	.lang-option {
		width: 100%;
		padding: 0.6rem 0.8rem;
		background: transparent;
		color: var(--color-text);
		border: none;
		border-bottom: 1px solid var(--color-border-light);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-align: left;
	}

	.lang-option:last-child {
		border-bottom: none;
	}

	.lang-option:hover {
		background: var(--color-bg-light);
	}

	.lang-option.active {
		background: var(--color-primary);
		color: var(--color-white);
	} */

	@media (max-width: 600px) {
		.footer-row {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
