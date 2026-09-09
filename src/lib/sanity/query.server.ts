import type { QueryParams } from '@sanity/client';
import { serverClient } from '$lib/sanity/client.server';

/**
 * What `locals.sanity.loadQuery` is on every request that is not previewing, in place of the
 * one `handleQueryLoader` installs.
 *
 * The vendor's loader asks for a result source map and carries a dedupe cache, and both exist
 * for Visual Editing: the map is what the overlays are drawn from, and the cache is what keeps
 * a live query from refetching on every keystroke in the Studio. A visitor who is not
 * previewing needs neither, and paying for them meant importing the whole Studio graph.
 *
 * The shape is the loader's, `{ data }`, because that is what every load function reads and
 * what `LiveQuery.svelte` renders when preview is off.
 */
export async function loadPublishedQuery<T>(
	query: string,
	params: QueryParams = {}
): Promise<{ data: T }> {
	const data = await serverClient.fetch<T>(query, params, {
		perspective: 'published',
		// `serverClient` has stega on for preview's sake. Emitting the markers here would put
		// invisible codepoints into strings this app uses as logic: an icon name, a catalogue id,
		// an href. `$lib/sanity/plain` exists because of what that costs.
		stega: false
	});

	return { data };
}
