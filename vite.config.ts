import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server:{
		allowedHosts: [
			"bb088f052d25.ngrok-free.app",
		]
	},
	ssr: {
		external: ['discord.js', 'tslib', '@discordjs/rest', '@discordjs/builders', '@discordjs/ws']
	}
});
