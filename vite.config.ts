import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server:{
		allowedHosts: [
			"967a3cac5c44.ngrok-free.app",
		]
	},
	ssr: {
		external: ['discord.js', 'tslib', '@discordjs/rest', '@discordjs/builders', '@discordjs/ws']
	}
});
