import { describe, expect, it } from 'vitest';
import { ogImage } from './og-image';

const REF = 'image-abc123def456-2000x1333-jpg';
const source = { asset: { _ref: REF }, alt: 'A clinician at a desk' };

describe('ogImage', () => {
	it.each([undefined, null, {}, { alt: 'no asset' }, { asset: {} }])(
		'offers no card for %o rather than a stand-in',
		(value) => {
			expect(ogImage(value as never)).toBeUndefined();
		}
	);

	it('produces the card size every scraper crops to', () => {
		const image = ogImage(source);

		expect(image).toMatchObject({ width: 1200, height: 630 });
		expect(image?.url).toContain('w=1200');
		expect(image?.url).toContain('h=630');
	});

	it('crops around the hotspot rather than letterboxing', () => {
		expect(ogImage(source)?.url).toContain('fit=crop');
	});

	/**
	 * The failure this prevents is silent: with `auto=format` the tags stay correct and the
	 * card renders blank, because the scraper was handed AVIF or WebP and stored nothing.
	 */
	it('names a raster format instead of negotiating one', () => {
		const url = ogImage(source)!.url;

		expect(url).toContain('fm=jpg');
		expect(url).not.toContain('auto=format');
	});

	it('is absolute and on the image CDN, so a scraper can fetch it', () => {
		expect(ogImage(source)!.url).toMatch(/^https:\/\/cdn\.sanity\.io\/images\//);
	});

	it('carries the alt text the page already shows', () => {
		expect(ogImage(source)?.alt).toBe('A clinician at a desk');
	});

	it('strips the preview source markers from the alt text', () => {
		expect(ogImage({ ...source, alt: 'A​ clinician⁢ at a desk' })?.alt)
			.toBe('A clinician at a desk');
	});

	it('carries an empty alt rather than undefined when the editor set none', () => {
		expect(ogImage({ asset: { _ref: REF } })?.alt).toBe('');
	});
});
