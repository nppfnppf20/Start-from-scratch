// frontend/svelte.config.js
import adapter from '@sveltejs/adapter-static'; // Ensure this is adapter-static
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html', // Important for SPAs
			precompress: false
		})
	}
};

export default config;
