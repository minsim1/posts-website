<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import MenuIcon from './icons/MenuIcon.svelte';
	import UserIcon from './icons/UserIcon.svelte';
	import CloseIcon from './icons/CloseIcon.svelte';
	import Button from './inputs/Button.svelte';
    import LocalStorageHelper from '../helpers/local-storage';
    import type { SanitizedUser } from '$lib/api/types';
    import { LogOut } from '$lib/helpers/logout';

	let currentPath = $state('');
	let isMobileMenuOpen = $state(false);
	let isProfileDropdownOpen = $state(false);
	let windowWidth = $state(0);
	let user = $state<SanitizedUser | null>(null);

	const navLinks = [
		// { path: '/', label: 'Landing' },
		{ path: '/home', label: 'Home' },
		{ path: '/about', label: 'About' },
		{ path: '/history', label: 'History' }
	];

	const MOBILE_BREAKPOINT = 768;

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	function toggleProfileDropdown() {
		isProfileDropdownOpen = !isProfileDropdownOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.profile-section')) {
			isProfileDropdownOpen = false;
		}
	}

	async function handleLogout() {
		await LogOut();
	}

	function updateWindowWidth() {
		windowWidth = window.innerWidth;
		if (windowWidth >= MOBILE_BREAKPOINT) {
			isMobileMenuOpen = false;
		}
	}

	async function loadUserData(){
		user = await LocalStorageHelper.GetUserData();
	}

	function closeDropdowns(){
		isProfileDropdownOpen = false;
		isMobileMenuOpen = false;
	}

	onMount(() => {
		const unsubscribe = page.subscribe(($page) => {
			currentPath = $page.url.pathname;
		});

		loadUserData();
		updateWindowWidth();
		window.addEventListener('resize', updateWindowWidth);
		document.addEventListener('click', handleClickOutside);

		return () => {
			unsubscribe();
			window.removeEventListener('resize', updateWindowWidth);
			document.removeEventListener('click', handleClickOutside);
		};
	});

	$effect(() => {
		if (isMobileMenuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	});
</script>

<header class="header">
	<div class="header-content">
		<div class="nav-left">
			{#if windowWidth < MOBILE_BREAKPOINT}
				<button class="mobile-menu-toggle" onclick={toggleMobileMenu} aria-label="Toggle menu">
					<MenuIcon />
				</button>
			{:else}
				<nav class="desktop-nav">
					{#each navLinks as link}
						{#if currentPath !== link.path}
							<a href={link.path} class="nav-link">{link.label}</a>
						{/if}
					{/each}
				</nav>
			{/if}
		</div>

		<div class="nav-right">
			{#if user}
				<span class="username">Welcome, {user.username}</span>
				<div class="profile-section">
					<button class="profile-button" onclick={toggleProfileDropdown} aria-label="Profile menu">
						<UserIcon />
					</button>
					{#if isProfileDropdownOpen}
						<div class="profile-dropdown">
							{#if user.role == "admin"}
								<a href="/admin" onclick={closeDropdowns} class="dropdown-item">Admin Panel</a>
							{/if}
							{#if user.role == "admin" || user.role == "moderator"}
								<a href="/moderation" onclick={closeDropdowns} class="dropdown-item">Moderation</a>
							{/if}
							<a href="/profile" onclick={closeDropdowns} class="dropdown-item">Profile</a>
							<button class="dropdown-item logout" onclick={handleLogout}>Log Out</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="auth-buttons">
					<Button type="button" variant="secondary" fullWidth={false} on:click={() => goto('/login')}>
						Login
					</Button>
					<Button type="button" variant="primary" fullWidth={false} on:click={() => goto('/register')}>
						Register
					</Button>
				</div>
			{/if}
		</div>
	</div>
</header>

{#if isMobileMenuOpen}
	<div class="mobile-menu-overlay" onclick={closeMobileMenu} onkeydown={(e) => e.key === 'Enter' && closeMobileMenu()} role="button" tabindex="-1"></div>
	<div class="mobile-menu">
		<div class="mobile-menu-header">
			<span>Menu</span>
			<button class="close-button" onclick={closeMobileMenu} aria-label="Close menu">
				<CloseIcon />
			</button>
		</div>
		<nav class="mobile-nav">
			{#each navLinks as link}
				{#if currentPath !== link.path}
					<a href={link.path} class="mobile-nav-link" onclick={closeMobileMenu}>
						{link.label}
					</a>
				{/if}
			{/each}
		</nav>
	</div>
{/if}

<style>
	.header {
		width: 100%;
		background: var(--color-bg-light);
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.nav-left {
		display: flex;
		align-items: center;
	}

	.desktop-nav {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.nav-link {
		color: var(--color-text);
		text-decoration: none;
		font-size: 1rem;
		transition: color 0.2s;
		padding: 0.5rem 0;
	}

	.nav-link:hover {
		color: var(--color-primary);
	}

	.mobile-menu-toggle {
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.username {
		color: var(--color-text);
		font-size: 0.95rem;
	}

	.profile-section {
		position: relative;
	}

	.profile-button {
		background: var(--color-bg-main);
		border: 2px solid var(--color-border);
		color: var(--color-text);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.profile-button:hover {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
		transform: scale(1.05);
	}

	.profile-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		background: var(--color-bg-main);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		min-width: 150px;
		z-index: 101;
	}

	.dropdown-item {
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		color: var(--color-text);
		border: none;
		font-size: 0.95rem;
		cursor: pointer;
		transition: background-color 0.2s;
		text-align: left;
		display: block;
		text-decoration: none;
		border-bottom: 1px solid var(--color-border-light);
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.dropdown-item:hover {
		background: var(--color-bg-light);
	}

	.dropdown-item.logout {
		color: var(--color-error);
	}

	.dropdown-item.logout:hover {
		background: var(--color-error-bg);
	}

	.auth-buttons {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.mobile-menu-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 998;
	}

	.mobile-menu {
		position: fixed;
		top: 0;
		left: 0;
		width: 70%;
		max-width: 300px;
		height: 100%;
		background: var(--color-bg-light);
		z-index: 999;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.mobile-menu-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.mobile-menu-header span {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.close-button {
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mobile-nav {
		display: flex;
		flex-direction: column;
		padding: 1rem 0;
	}

	.mobile-nav-link {
		color: var(--color-text);
		text-decoration: none;
		font-size: 1rem;
		padding: 1rem 1.5rem;
		transition: background-color 0.2s;
	}

	.mobile-nav-link:hover {
		background: var(--color-bg-main);
	}

	.mobile-menu-overlay:focus {
		outline: none;
	}

	@media (max-width: 768px) {
		.username {
			display: none;
		}
	}
</style>
