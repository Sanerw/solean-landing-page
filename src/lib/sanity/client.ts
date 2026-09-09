import { createClient } from '@sanity/client';
import { apiHost, apiVersion, dataset, projectId, studioUrl } from '$lib/sanity/api';

/**
 * The published-content client, safe in the browser. `stega` embeds the invisible source
 * markers the Presentation tool turns into click-to-edit overlays; they are only emitted when a
 * request actually runs in preview, so ordinary reads carry no extra bytes.
 *
 * Built from `@sanity/client` rather than the re-export in `@sanity/sveltekit`. The two are the
 * same function, but that package has one entry point and it statically imports the Studio:
 * `PerspectiveProvider`, `WorkspaceLoader`, React, Sanity UI and its stylesheet. Reaching for
 * it here put all of that in the server bundle, where evaluating it cost 354 ms of every cold
 * start, and would put the stylesheet on any page that imported this module.
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
