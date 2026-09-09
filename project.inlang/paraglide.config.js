import { defineConfig } from '@inlang/paraglide-js';

/**
 * The compiler options both surfaces read: the Vite plugin in `vite.config.ts`, which compiles on
 * dev, build and test, and `paraglide-js compile`, which is what `pnpm check` runs before
 * svelte-check. They have to agree. `src/lib/paraglide` is generated and git-ignored, so a fresh
 * clone has no messages at all until one of them runs, and every import of them is a missing
 * module until then. An option passed at either call site would override this file, so neither
 * passes one.
 *
 * `outdir` is resolved against the repository root, the working directory for the CLI and Vite's
 * own root for the plugin, not against this file.
 */
export default defineConfig({
	outdir: './src/lib/paraglide',

	// `url` is first because it has to be: Paraglide's default pattern ends in
	// `toLocale(segment) || baseLocale`, so an unprefixed path answers German rather than
	// "no locale", and whichever strategy leads therefore decides every request on its own.
	// `cookie` behind it is never read, and is not decoration: `setLocale` writes it, which is
	// how the language switcher's choice survives a navigation at all.
	//
	// Reading it is `entryRedirect` in src/hooks.server.ts, which is where the whole decision
	// for an unprefixed address now lives, the remembered language and the browser's own.
	// Locked by src/lib/i18n/locale-resolution.test.ts.
	strategy: ['url', 'cookie', 'baseLocale']
});
