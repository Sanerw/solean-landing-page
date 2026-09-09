import { describe, expect, it } from 'vitest';
import { isPreviewRequest } from './preview-request';

/**
 * The gate in front of a 6 MB import, so a false positive costs a cold start and a false
 * negative costs the Studio its click-to-edit. Both directions are worth a case.
 */
describe('isPreviewRequest', () => {
	it('takes the endpoints preview answers itself', () => {
		// `handlePreviewMode` returns from these two before it reads any cookie, so the gate has
		// to let them through or preview can never be turned on at all.
		expect(isPreviewRequest('/preview/enable', null)).toBe(true);
		expect(isPreviewRequest('/preview/disable', null)).toBe(true);
	});

	it('takes a request carrying the preview cookie', () => {
		expect(isPreviewRequest('/', '__sanity_preview=abc123')).toBe(true);
		expect(isPreviewRequest('/learn', 'other=1; __sanity_preview=abc123; third=3')).toBe(true);
	});

	it('leaves an ordinary visitor alone', () => {
		expect(isPreviewRequest('/', null)).toBe(false);
		expect(isPreviewRequest('/', '')).toBe(false);
		expect(isPreviewRequest('/treatments/mounjaro', 'consent=granted; PARAGLIDE_LOCALE=en')).toBe(
			false
		);
	});

	it('is not fooled by a cookie whose name merely contains the preview one', () => {
		// `startsWith` on the trimmed part rather than `includes` on the whole header: a cookie
		// called `not__sanity_preview` is somebody else's, and matching it would put every
		// visitor who has one on the slow path.
		expect(isPreviewRequest('/', 'not__sanity_preview=1')).toBe(false);
		expect(isPreviewRequest('/', 'x=__sanity_preview=1')).toBe(false);
	});

	it('does not treat a page under the preview prefix as preview', () => {
		// Only the two exact endpoints. A path that merely starts the same way is a page.
		expect(isPreviewRequest('/preview', null)).toBe(false);
		expect(isPreviewRequest('/preview/enable/extra', null)).toBe(false);
	});
});
