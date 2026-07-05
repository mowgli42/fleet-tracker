import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html'
    }),
    prerender: {
      // Links like /maintenance#job-xxx point to rows that may not exist in prerendered HTML (data from store).
      handleMissingId: () => {},
      handleUnseenRoutes: 'ignore'
    }
  }
};

export default config;
