import { describe, expect, it } from 'vitest';
import { edgeCacheControl, EDGE_CACHE_CONTROL } from './edge-cache';

describe('edgeCacheControl', () => {
	it('caches an ordinary marketing response for an hour', () => {
		expect(edgeCacheControl(false)).toBe(EDGE_CACHE_CONTROL);
	});

	it('caches nothing while somebody is previewing', () => {
		// Draft content and the click-to-edit markers, in a cache shared with every visitor.
		expect(edgeCacheControl(true)).toBeNull();
	});

	it('keeps the browser out of it and the edge in it', () => {
		// `max-age=0` so a reload asks again and an editor is never fighting their own browser,
		// `s-maxage` for the shared cache, and a stale window of a minute rather than the day
		// the September header allowed, which is what made an edit invisible past its expiry.
		expect(EDGE_CACHE_CONTROL).toBe(
			'public, max-age=0, s-maxage=3600, stale-while-revalidate=60'
		);
	});
});
