import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Define your backend server port here
const backendPort = 5000; // <-- IMPORTANT: Change 5000 to your actual backend port if different

export default defineConfig({
	plugins: [
		sveltekit() // Keep your existing SvelteKit plugin
	],
	build: {
		sourcemap: true // Enable source maps for debugging production issues
	},
	// Add the 'server' configuration block for the proxy
	server: {
		proxy: {
			// This rule will proxy any request starting with /api
			'/api': {
				target: `http://localhost:${backendPort}`, // Forward requests to your backend server
				changeOrigin: true, // Standard practice, helps avoid CORS-like issues
				// No 'rewrite' needed if your backend routes already include /api
			}
			// You could add other proxy rules here if needed
		}
	}
});