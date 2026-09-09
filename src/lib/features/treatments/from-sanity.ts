import { eur, findTreatment, type Money } from '$lib/domain';
import { picture } from '$lib/sanity/image';
import type { SanityTreatment, SanityTreatmentsPage } from '$lib/sanity/queries';
import type { FaqItem, HowItWorksStep, PlanDuration, TreatmentPage } from './types';

/**
 * 27a needed a shape of its own here, because the fixture's `enhanced:img` photograph and
 * Sanity's CDN picture could not be one type while both were rendered. 27b removed the fixture,
 * so they are one type again and this is the alias the callers already import.
 */
export type SanityTreatmentPage = TreatmentPage;

/**
 * One treatment page, from Sanity to the shape the route already renders.
 *
 * Feature 25 held this as a typed fixture where a price change was a deploy; 27 reverses that.
 * What did not move is the join: `src/lib/domain` keeps the ids, the product names and the
 * Shopify variant, so an editor changes what a page says and never what it sells.
 */

/**
 * The gallery frame, a photograph running the width of a panel. One ladder rather than a
 * default, for the reason `marketing/from-sanity.ts` records: the browser suite decodes each
 * image and fails one drawn below the density it carries.
 */
const PHOTO_WIDTHS = [540, 768, 1080, 1366] as const;

const DURATIONS: readonly PlanDuration[] = [3, 6, 9, 12];

function isDuration(months: number): months is PlanDuration {
	return (DURATIONS as readonly number[]).includes(months);
}

/** Minor units both sides, so this is a rename rather than a conversion. */
function money(cents: number | undefined): Money {
	return eur(cents ?? 0);
}

/**
 * `null` rather than a throw: the route decides what a missing page means, and for this one it
 * means a 404.
 *
 * A document naming a `treatmentId` the catalogue does not have is refused here. It has no
 * product behind it, so it has no name, no form and no Shopify variant, and rendering it would
 * put a nameless page on a URL nothing links to.
 */
export function toTreatmentPage(document: SanityTreatment | null): SanityTreatmentPage | null {
	if (!document) return null;
	if (!findTreatment(document.treatmentId)) return null;

	return {
		slug: document.treatmentId,
		formLabel: document.formLabel,
		isNew: document.isNew ?? false,
		galleryCaption: document.galleryCaption,
		intro: document.intro,
		...(document.photo?.asset
			? {
					photo: {
						picture: picture(document.photo, PHOTO_WIDTHS),
						alt: document.photo.alt ?? ''
					}
				}
			: {}),
		// Ordered here rather than trusted, because the comparison table reads every treatment
		// across the same durations and a row out of order would misalign against its neighbours.
		doses: (document.doses ?? []).map((dose) => ({
			label: dose.label,
			monthlyPrice: money(dose.monthlyPriceCents)
		})),
		plans: (document.plans ?? [])
			.filter((plan) => isDuration(plan.durationMonths))
			.map((plan) => ({
				durationMonths: plan.durationMonths as PlanDuration,
				monthlyPrice: money(plan.monthlyPriceCents),
				recommended: plan.recommended ?? false
			}))
			.sort((a, b) => a.durationMonths - b.durationMonths),
		firstMonth: money(document.firstMonthCents),
		clinicianNote: {
			title: document.clinicianNote?.title ?? '',
			body: document.clinicianNote?.body ?? ''
		}
	};
}

/**
 * Every treatment the page needs, keyed by id. The plan comparison reads all of them whichever
 * one is being viewed, so they arrive together and the page picks its own out of the map.
 *
 * A document naming an id the catalogue does not have is dropped rather than throwing: one
 * bad document should cost its own row, not every treatment page on the site.
 */
export function toTreatmentPages(
	documents: readonly SanityTreatment[] | null
): Map<string, SanityTreatmentPage> {
	const pages = new Map<string, SanityTreatmentPage>();

	for (const document of documents ?? []) {
		const page = toTreatmentPage(document);
		if (page) pages.set(page.slug, page);
	}

	return pages;
}

/**
 * The shared sections. An absent singleton costs the page those two sections and nothing else:
 * a draft nobody has filled yet is a legitimate state, and the rest of the page still renders.
 */
export function toSharedSections(document: SanityTreatmentsPage | null): {
	howItWorks: readonly HowItWorksStep[];
	faqs: readonly FaqItem[];
} {
	return {
		howItWorks: (document?.howItWorks ?? []).map((step) => ({
			title: step.title,
			body: step.body
		})),
		faqs: (document?.faqs ?? []).map((faq) => ({
			question: faq.question,
			answer: faq.answer
		}))
	};
}
