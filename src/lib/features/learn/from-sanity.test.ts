import { describe, expect, it, vi } from 'vitest';
import type { ArticleDetail } from '$lib/sanity/queries';

// The mapper reaches the Sanity image builder, which reads `$env/static/public`. Vitest runs
// outside SvelteKit, so the module is stubbed rather than the env faked: what matters here is
// the mapping, and a URL builder has its own tests upstream.
vi.mock('$lib/sanity/image', () => ({
	urlFor: () => ({
		width: () => ({ height: () => ({ url: () => 'https://cdn.example/image.jpg' }) })
	})
}));

const { articleToc, toArticle } = await import('./from-sanity');

function article(overrides: Partial<ArticleDetail> = {}): ArticleDetail {
	return {
		_id: 'a1',
		title: 'Mounjaro vs Wegovy',
		category: 'Treatment comparison',
		summary: 'A comparison.',
		slug: { current: 'mounjaro-vs-wegovy' },
		reviewedAt: '2026-08-14',
		treatmentProfiles: [
			{
				_key: 'k-mounjaro',
				treatmentId: 'mounjaro',
				activeIngredient: 'Tirzepatide',
				manufacturer: 'Eli Lilly'
			},
			{
				_key: 'k-wegovy',
				treatmentId: 'wegovy',
				activeIngredient: 'Semaglutide',
				manufacturer: 'Novo Nordisk'
			}
		],
		...overrides
	} as ArticleDetail;
}

describe('articleToc', () => {
	it('lists only the sections the article fills, in the page order', () => {
		const toc = articleToc(
			article({
				quickAnswer: ['one'],
				howTheyWork: ['how'],
				faqs: [{ _key: 'f1', question: 'q', answer: 'a' }]
			})
		);

		expect(toc.map((item) => item.id)).toEqual([
			'quick-answer',
			'at-a-glance',
			'how-they-work',
			'manufacturers',
			'faqs'
		]);
	});

	it('drops the side effects entry when the section has no items', () => {
		const toc = articleToc(article({ sideEffects: { intro: 'Only an intro' } }));

		expect(toc.map((item) => item.id)).not.toContain('side-effects');
	});

	it('drops the comparison entries when fewer than two treatments are compared', () => {
		const toc = articleToc(article({ treatmentProfiles: [] }));

		expect(toc.map((item) => item.id)).not.toContain('at-a-glance');
		expect(toc.map((item) => item.id)).not.toContain('manufacturers');
	});

	it('gives every entry a label', () => {
		const toc = articleToc(article({ quickAnswer: ['one'] }));

		expect(toc.every((item) => item.label.length > 0)).toBe(true);
	});
});

describe('toArticle', () => {
	it('maps the comparison to exactly two profiles, resolved against the catalogue', () => {
		const mapped = toArticle(article());

		expect(mapped.comparison.profiles).toHaveLength(2);
		expect(mapped.comparison.profiles[0].treatment.name).toBe('Mounjaro');
		expect(mapped.comparison.profiles[1].treatment.name).toBe('Wegovy');
		// The manufacturers section reads the same entries, so the page cannot show two
		// different pairs of treatments.
		expect(mapped.manufacturers).toBe(mapped.comparison.profiles);
	});

	it('refuses an article that compares fewer than two treatments', () => {
		expect(() => toArticle(article({ treatmentProfiles: [] }))).toThrow(/needs two/);
	});

	it('refuses a treatment the catalogue does not know', () => {
		expect(() =>
			toArticle(
				article({
					treatmentProfiles: [
						{ _key: 'a', treatmentId: 'not-a-treatment', activeIngredient: 'x', manufacturer: 'y' },
						{ _key: 'b', treatmentId: 'wegovy', activeIngredient: 'x', manufacturer: 'y' }
					]
				})
			)
		).toThrow(/not in the catalogue/);
	});

	it('leaves the hero null when the document has no image', () => {
		expect(toArticle(article()).hero.src).toBeNull();
	});

	it('leaves the reviewer portrait null when there is none', () => {
		const mapped = toArticle(
			article({ reviewer: { _id: 'c1', name: 'Dr. Juraj Galan', role: 'Consulting physician' } })
		);

		expect(mapped.review.reviewer.portraitUrl).toBeNull();
		expect(mapped.review.reviewer.name).toBe('Dr. Juraj Galan');
	});

	it('builds a URL for the hero and the portrait when both are set', () => {
		const image = { asset: { _ref: 'image-abc-805x650-jpg' }, alt: 'Syringes' };
		const mapped = toArticle(
			article({
				hero: image,
				reviewer: { _id: 'c1', name: 'Dr. Juraj Galan', role: 'Consulting physician', portrait: image }
			})
		);

		expect(mapped.hero.src).toBe('https://cdn.example/image.jpg');
		expect(mapped.hero.alt).toBe('Syringes');
		expect(mapped.review.reviewer.portraitUrl).toBe('https://cdn.example/image.jpg');
	});

	it('fills the optional sections with empty values rather than undefined', () => {
		const mapped = toArticle(article());

		expect(mapped.quickAnswer).toEqual([]);
		expect(mapped.keyTakeaways).toEqual([]);
		expect(mapped.sideEffects).toEqual({ intro: '', items: [] });
		expect(mapped.sourcesSummary).toBe('');
		expect(mapped.shortTitle).toBe('Mounjaro vs Wegovy');
	});
});
