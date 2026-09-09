import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-vercel';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
// From vitest, not vite: the same config, plus the `test` key below.
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		// Compiles messages/{locale}.json into typed functions under src/lib/paraglide, which is
		// generated and git-ignored. `baseLocale` is German, set in project.inlang/settings.json,
		// so the bare path serves the market's own language and English lives under `/en`.
		//
		// The order looks like the one this fix came to change, and its meaning is not the same.
		// `url` is first because it has to be: Paraglide's default pattern ends in
		// `toLocale(segment) || baseLocale`, so an unprefixed path answers German rather than
		// "no locale", and whichever strategy leads therefore decides every request on its own.
		// `cookie` behind it is never read, and is not decoration: `setLocale` writes it, which is
		// how the language switcher's choice survives a navigation at all.
		//
		// Reading it is `entryRedirect` in src/hooks.server.ts, which is where the whole decision
		// for an unprefixed address now lives, the remembered language and the browser's own.
		// Locked by src/lib/i18n/locale-resolution.test.ts.
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'cookie', 'baseLocale']
		}),
		tailwindcss(),
		enhancedImages(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Pinned rather than left to adapter-auto, which would install this same adapter part way
			// through the Vercel build and rewrite the lockfile while it runs. A static build is not an
			// option: `/api/checkout` has to execute server-side.
			adapter: adapter()
		})
	],
	test: {
		// Unit tests only, beside the source they cover. `e2e/` is Playwright's and would be
		// collected by the default glob, then fail on an import Vitest cannot provide.
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
