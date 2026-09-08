import { describe, expect, it, vi } from 'vitest';
import type { ArticleDetail } from '$lib/sanity/queries';

// The mapper reaches the Sanity image builder, which reads `$env/static/public`. Vitest runs
// outside SvelteKit, so the module is stubbed rather than the env faked: what matters here is
// the mapping, and the builder has its own tests upstream. The stubs echo the ladder they were
// handed, so a test can assert which frame the mapper asked for.
vi.mock('$lib/sanity/image', () => {
	const built = (source: { alt?: string }, widths: readonly number[]) => ({
		src: 'https://cdn.example/image.jpg',
		srcset: widths.map((width) => `https://cdn.example/image.jpg?w=${width} ${width}w`).join(', '),
		alt: source.alt ?? '',
		width: widths[widths.length - 1],
		height: 100
	});

	return { picture: built, croppedPicture: built };
});

const { toArticle } = await import('./from-sanity');

function article(overrides: Partial<ArticleDetail> = {}): ArticleDetail {
	return {
		_id: 'a1',
		title: 'Mounjaro vs Wegovy',
		category: 'Treatment comparison',
		summary: 'A comparison.',
		slug: { current: 'mounjaro-vs-wegovy' },
		reviewedAt: '2026-08-14',
		...overrides
	} as ArticleDetail;
}

describe('toArticle', () => {
	// An article without a photograph loses the photograph, not the hero: the badge, the title
	// and the metadata still have to draw over the panel.
	it('leaves the hero undefined when the document has no image', () => {
		expect(toArticle(article()).hero).toBeUndefined();
	});

	it('leaves the reviewer portrait undefined when there is none', () => {
		const mapped = toArticle(
			article({ reviewer: { _id: 'c1', name: 'Dr. Juraj Galan', role: 'Consulting physician' } })
		);

		expect(mapped.review.reviewer.portrait).toBeUndefined();
		expect(mapped.review.reviewer.name).toBe('Dr. Juraj Galan');
	});

	it('builds the hero on the panel ladder and the portrait on the avatar one', () => {
		const image = { asset: { _ref: 'image-abc-1920x1080-jpg' }, alt: 'Syringes' };
		const mapped = toArticle(
			article({
				hero: image,
				reviewer: { _id: 'c1', name: 'Dr. Juraj Galan', role: 'Consulting physician', portrait: image }
			})
		);

		expect(mapped.hero?.src).toBe('https://cdn.example/image.jpg');
		expect(mapped.hero?.alt).toBe('Syringes');
		// The full-bleed frame, not the 805px box the hero used to be. A ladder topping out
		// below the panel's own width is what the density test exists to catch.
		expect(mapped.hero?.srcset).toContain('?w=1920 1920w');
		expect(mapped.review.reviewer.portrait?.srcset).toContain('?w=120 120w');
	});

	// The chips are never empty, so the hero's row cannot be. The rule itself is `tagsOf`'s,
	// tested in `journal.test.ts`; this is the mapper reaching it at all.
	it('falls the tags back to the category when the document carries none', () => {
		expect(toArticle(article()).tags).toEqual(['Treatment comparison']);
		expect(toArticle(article({ tags: ['Weight loss'] })).tags).toEqual(['Weight loss']);
	});

	// An article an editor has created and not yet written is a legitimate state, not a 500.
	it('gives a document with no body an empty one rather than undefined', () => {
		expect(toArticle(article()).body).toEqual([]);
	});

	it('carries the body through the block mapper', () => {
		const mapped = toArticle(
			article({
				body: [
					{ _key: 'b1', _type: 'articleCallout', heading: 'Quick answer', paragraphs: ['one'] }
				]
			})
		);

		expect(mapped.body).toEqual([
			{
				kind: 'callout',
				id: 'quick-answer',
				heading: 'Quick answer',
				label: 'Quick answer',
				paragraphs: ['one']
			}
		]);
	});
});
