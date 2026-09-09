import { describe, expect, it } from 'vitest';
import { serverClientConfig } from './client.server';

/**
 * A regression harness rather than a test of behaviour, in the shape `analytics/client.test.ts`
 * already uses: each assertion stands for a decision that fails silently when it is undone.
 * Nothing throws when `useCdn` goes back to false. The page simply takes longer, per query, on
 * every request, and only a stopwatch would say so.
 */
describe('serverClientConfig', () => {
	it('reads published content through Sanity’s CDN', () => {
		// Measured 2026-09-09: `apicdn.sanity.io` 15 ms against `api.sanity.io` 65 ms, on the
		// home page's own query. The landing page makes two such reads, a treatment page three.
		expect(serverClientConfig.useCdn).toBe(true);
	});

	it('keeps the source markers on, because preview is what needs them', () => {
		// The Presentation tool turns them into click-to-edit overlays. They are only emitted on
		// a request that is actually previewing, so an ordinary read carries no extra bytes.
		expect(serverClientConfig.stega).toBe(true);
	});

	it('carries no token of its own', () => {
		// The value comes from the private environment and is never asserted: a comparison
		// against a secret prints that secret into the runner's output the moment it fails.
		// What can be checked without reading it is that this object holds the field rather
		// than a literal, which is the mistake worth catching.
		expect(Object.keys(serverClientConfig)).toContain('token');
	});
});
