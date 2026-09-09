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
		// The output directory and the strategy live in project.inlang/paraglide.config.js, which
		// `paraglide-js compile` reads as well. `pnpm check` never runs Vite, so it compiles the
		// messages itself and has to produce exactly what this plugin produces. An option passed
		// here would override that file, so none is.
		paraglideVitePlugin({ project: './project.inlang' }),
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
			//
			// The region is named because the default is `iad1`, Washington, and everything this
			// render talks to is in Europe: the visitors, and the Content Lake it reads on the way.
			// Measured on 2026-09-09, `x-vercel-id` read `arn1::iad1`, so a request entering in
			// Stockholm crossed the Atlantic and back before a byte was written. One region is
			// available on every plan; only a list of them is an Enterprise feature.
			adapter: adapter({ regions: ['fra1'] })
		})
	],
	ssr: {
		// Bundled, not left as a bare import for the runtime to resolve. Two versions of this
		// package are in the tree: ours and `@sanity/sveltekit`'s at 7.26.2, and the Studio's at
		// 8.4.0 through `sanity`. Externalising the specifier collapses them onto whichever one
		// sits at the root, and the Studio then fails to start on an export 7.x does not have
		// (`isTimeoutError`), taking `/preview/enable` down with it. Bundling keeps each importer
		// on the copy it resolved, which is what happened before this app depended on the package
		// directly.
		noExternal: ['@sanity/client']
	},
	test: {
		// Unit tests only, beside the source they cover. `e2e/` is Playwright's and would be
		// collected by the default glob, then fail on an import Vitest cannot provide.
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
