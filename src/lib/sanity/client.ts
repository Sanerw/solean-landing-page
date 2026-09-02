import { createClient } from '@sanity/sveltekit';
import { apiHost, apiVersion, dataset, projectId, studioUrl } from '$lib/sanity/api';

/**
 * The published-content client, safe in the browser. `stega` embeds the invisible source
 * markers the Presentation tool turns into click-to-edit overlays; they are only emitted when a
 * request actually runs in preview, so ordinary reads carry no extra bytes.
 *
 * Importing `@sanity/sveltekit` pulls its whole single entry point, Sanity UI stylesheet
 * included, so nothing that renders on an ordinary page may import this module eagerly. Server
 * modules are fine; on the client it is loaded only inside the preview branch of the root
 * layout. See the comment there.
 */
export const client = createClient({
	projectId,
	dataset,
	apiVersion,
	useCdn: true,
	stega: { studioUrl },
	// Pointed at the fixture server by the browser harness, so a test run is deterministic and
	// puts no traffic on Sanity. `useProjectHostname` off because the client would otherwise
	// address the fixture as `<projectId>.localhost`, which nothing resolves.
	...(apiHost ? { apiHost, useProjectHostname: false } : {})
});
