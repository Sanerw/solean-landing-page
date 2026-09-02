// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SanityLocals } from '@sanity/sveltekit';
import type { Locale } from '$lib/paraglide/runtime';

declare global {
	namespace App {
		// interface Error {}
		interface Locals extends SanityLocals {
			/** Set by the Paraglide handle, read by every Sanity query. */
			locale: Locale;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
