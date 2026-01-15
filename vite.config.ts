import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server:{
		allowedHosts: []
	},
	ssr: {
		external: ['discord.js', 'tslib', '@discordjs/rest', '@discordjs/builders', '@discordjs/ws']
	}
});
