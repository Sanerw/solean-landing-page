import { redirect } from '@sveltejs/kit';
import { journey } from '$lib/journey/journey.svelte';
import { canEnter } from '$lib/journey/stages';

/**
 * The guard pattern features 7, 9 and 11 copy.
 *
 * The journey session lives in sessionStorage, which the server cannot read, so a guarded
 * group opts out of SSR and guards in a universal `+layout.ts`. The load then runs in the
 * browser only, where the session is readable, and `redirect` fires before any guarded
 * content paints. Two rejected alternatives, for the record:
 *
 *   - Guarding in a component `$effect` keeps SSR but paints the guarded content first,
 *     then removes it: a visible flash on every blocked entry.
 *   - Guarding in a universal load behind a `browser` check silently does nothing on a
 *     direct deep link, because the load runs on the server, finds no session, returns,
 *     and never re-runs after hydration.
 *
 * Real funnel routes should redirect to `access.redirectTo`. This dev surface sends you
 * back to the scenario page instead, because the product routes it names do not exist yet.
 */
export const ssr = false;

export const load = () => {
	const access = canEnter('checkout', journey.session);

	if (!access.allowed) {
		redirect(307, '/dev/scenario');
	}
};
