// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { QueryParams } from '@sanity/client';
import type { Locale } from '$lib/paraglide/runtime';
import type { PageSeo } from '$lib/seo/metadata';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Set by the Paraglide handle, read by every Sanity query. */
			locale: Locale;
			/**
			 * Narrower than `SanityLocals` from `@sanity/sveltekit`, which declares six fields of
			 * which this app reads two. Declaring the wide one would mean the ordinary request
			 * path had to satisfy fields only preview ever sets, and importing its types here
			 * would put the package back in front of a reader looking for what the server needs.
			 * Preview still sets the rest at runtime; nothing reads them.
			 */
			sanity: {
				previewEnabled: boolean;
				loadQuery: <T>(query: string, params?: QueryParams) => Promise<{ data: T }>;
			};
		}
		interface PageData {
			/**
			 * Set by the server load of every public page, and by nothing else. The root layout
			 * renders the title, description, canonical, language links and sharing tags from
			 * it, so a route that does not set it keeps its own `<title>` and emits no
			 * metadata. Its `sharing` half is null without a configured origin.
			 */
			seo?: PageSeo | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
