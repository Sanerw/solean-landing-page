import { describe, expect, it, vi } from 'vitest';
import type { SanityTreatment } from '$lib/sanity/queries';

// The mapper reaches the Sanity image builder, which reads `$env/static/public`. Vitest runs
// outside SvelteKit, so the module is stubbed rather than the env faked, the way
// `learn/from-sanity.test.ts` does it. The stub echoes the ladder it was handed, so a test can
// assert which frame the mapper asked for.
vi.mock('$lib/sanity/image', () => ({
	picture: (source: { alt?: string }, widths: readonly number[]) => ({
		src: 'https://cdn.example/photo.webp',
		srcset: widths.map((width) => `https://cdn.example/photo.webp?w=${width} ${width}w`).join(', '),
		alt: source.alt ?? '',
		width: widths[widths.length - 1],
		height: 100
	})
}));

const { toSharedSections, toTreatmentPage } = await import('./from-sanity');

function treatment(overrides: Partial<SanityTreatment> = {}): SanityTreatment {
	return {
		treatmentId: 'wegovy-pill',
		language: 'en',
		formLabel: 'Daily tablet',
		galleryCaption: 'Semaglutide tablet',
		intro: 'A daily tablet.',
		doses: [{ _key: 'd1', label: '1.5mg', monthlyPriceCents: 12_400 }],
		plans: [{ _key: 'p1', durationMonths: 3, monthlyPriceCents: 12_400, recommended: false }],
		firstMonthCents: 6_900,
		...overrides
	} as SanityTreatment;
}

describe('toTreatmentPage', () => {
	it('reads prices as the minor units both sides already use', () => {
		const page = toTreatmentPage(treatment())!;

		expect(page.doses[0].monthlyPrice).toEqual({ amount: 12_400, currency: 'EUR' });
		expect(page.plans[0].monthlyPrice).toEqual({ amount: 12_400, currency: 'EUR' });
		expect(page.firstMonth).toEqual({ amount: 6_900, currency: 'EUR' });
	});

	// The comparison table reads every treatment across the same durations, so a row out of
	// order would misalign against its neighbours rather than merely look odd on its own.
	it('orders the plans by commitment however the document lists them', () => {
		const page = toTreatmentPage(
			treatment({
				plans: [
					{ _key: 'c', durationMonths: 12, monthlyPriceCents: 10_900 },
					{ _key: 'a', durationMonths: 3, monthlyPriceCents: 12_400 },
					{ _key: 'b', durationMonths: 6, monthlyPriceCents: 11_900, recommended: true }
				]
			})
		)!;

		expect(page.plans.map((plan) => plan.durationMonths)).toEqual([3, 6, 12]);
		expect(page.plans.map((plan) => plan.recommended)).toEqual([false, true, false]);
	});

	it('drops a commitment length the page has no column for', () => {
		const page = toTreatmentPage(
			treatment({
				plans: [
					{ _key: 'a', durationMonths: 3, monthlyPriceCents: 12_400 },
					{ _key: 'b', durationMonths: 7, monthlyPriceCents: 11_000 }
				]
			})
		)!;

		expect(page.plans.map((plan) => plan.durationMonths)).toEqual([3]);
	});

	/**
	 * The join to `src/lib/domain`. A document naming an id the catalogue does not have has no
	 * product behind it, so no name, no form and no Shopify variant.
	 */
	it('refuses a treatment the catalogue does not know', () => {
		expect(toTreatmentPage(treatment({ treatmentId: 'not-a-treatment' }))).toBeNull();
	});

	it('answers a missing document with null rather than an empty page', () => {
		expect(toTreatmentPage(null)).toBeNull();
	});

	// Wegovy Pill has no photograph on purpose: a syringe under "daily tablet" is the wrong
	// medicine, and the gallery draws its ground, chips and caption either way.
	it('leaves the photo undefined when the document has none', () => {
		expect(toTreatmentPage(treatment())?.photo).toBeUndefined();
	});

	it('builds the photo on the panel ladder', () => {
		const page = toTreatmentPage(
			treatment({ photo: { asset: { _ref: 'image-abc-1200x800-webp' }, alt: 'A pen beside its box' } })
		)!;

		expect(page.photo?.alt).toBe('A pen beside its box');
		expect(page.photo?.picture.srcset).toContain('?w=1366 1366w');
	});

	// A half-written draft has to preview rather than throw.
	it('fills the optional parts with empty values', () => {
		const page = toTreatmentPage({
			treatmentId: 'wegovy',
			language: 'de',
			formLabel: '',
			galleryCaption: '',
			intro: ''
		} as SanityTreatment)!;

		expect(page.doses).toEqual([]);
		expect(page.plans).toEqual([]);
		expect(page.isNew).toBe(false);
		expect(page.firstMonth).toEqual({ amount: 0, currency: 'EUR' });
		expect(page.clinicianNote).toEqual({ title: '', body: '' });
	});
});

describe('toSharedSections', () => {
	it('carries the steps and the questions in the order they were written', () => {
		const shared = toSharedSections({
			howItWorks: [{ _key: 's1', title: 'Answer', body: 'Ten minutes.' }],
			faqs: [{ _key: 'f1', question: 'Is it safe?', answer: 'A doctor decides.' }]
		});

		expect(shared.howItWorks).toEqual([{ title: 'Answer', body: 'Ten minutes.' }]);
		expect(shared.faqs).toEqual([{ question: 'Is it safe?', answer: 'A doctor decides.' }]);
	});

	// An unfilled singleton costs the page two sections and nothing else.
	it('answers a missing singleton with empty sections rather than throwing', () => {
		expect(toSharedSections(null)).toEqual({ howItWorks: [], faqs: [] });
	});
});
