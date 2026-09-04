import { eur } from '$lib/domain';
import { recommendationUrl } from '$lib/config/rxscale';
import type { RecommendedOption, RecommendedPlan } from '$lib/features/questionnaire/recommendation';

/**
 * The product recommendation RxScale computes from a submitted anamnesis. This is the call
 * their own storefront makes the moment a submission returns, and it is what decides which
 * treatments and which doses a person may order.
 *
 * Server-side because the raw document is over a megabyte of catalogue graph the browser has
 * no use for. It validated the variant the browser later asked to buy as well, until that
 * check was removed on 2026-09-04.
 */

export type RecommendationResult =
	| { ok: true; plans: RecommendedPlan[] }
	| { ok: false; reason: 'not-configured' | 'unavailable' };

function record(value: unknown): Record<string, unknown> | null {
	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

/**
 * RxScale records the shop by its myshopify domain, while the store domain may arrive with a
 * scheme so the harness can point it at the fixture. Compared bare, so the two agree.
 */
function shopIdentifier(storeDomain: string): string {
	return storeDomain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

/**
 * A SKU carries a `shop_skus` entry per shop it is listed in, so the one for the shop this
 * deployment sells through is the only one whose variant id means anything here.
 */
function variantFor(
	sku: Record<string, unknown>,
	storeDomain: string
): { id: string; price: number } | null {
	const listings = Array.isArray(sku.shop_skus) ? sku.shop_skus : [];

	for (const listing of listings) {
		const entry = record(listing);
		if (!entry) continue;
		if (text(record(entry.shop)?.identifier) !== storeDomain) continue;

		const id = text(entry.shop_variation_id);
		const price = entry.price;
		if (id && typeof price === 'number') return { id, price };
	}

	return null;
}

/**
 * What distinguishes one option from another within a plan, which is the dose. Empty when
 * there is nothing to distinguish: Shopify names the only variant of a single-variant product
 * `Default Title`, and the shop's own display name repeats the product title in front of it.
 * Either would render as a label saying what the heading above it already says.
 */
function doseLabel(sku: Record<string, unknown>, shopData: Record<string, unknown> | null): string {
	const dose = text(sku.display_name);
	if (dose && dose !== 'Default Title') return dose;

	const displayed = text(shopData?.displayName);

	return displayed.endsWith('Default Title') ? '' : displayed;
}

/**
 * `therapy_duration` arrives as a number on some listings and as a string on others, and is
 * absent on the rest. Only a whole positive count of days is worth showing: anything else is
 * a value we do not understand, and the screen says nothing rather than guessing.
 */
function therapyDays(sku: Record<string, unknown>): number | null {
	const raw = sku.therapy_duration;
	const days = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;

	return Number.isInteger(days) && days > 0 ? days : null;
}

function offersIn(
	entry: Record<string, unknown>,
	storeDomain: string
): { options: RecommendedOption[]; digital: boolean } {
	const raw = Array.isArray(entry.skus) ? entry.skus : [];
	const options: RecommendedOption[] = [];
	let digital = true;

	for (const candidate of raw) {
		const offer = record(candidate);
		// `selectable` is RxScale's verdict on this dose. An unselectable option is not a
		// disabled button here: it is left out, so nothing can order it by accident.
		if (!offer || offer.selectable !== true) continue;

		const sku = record(offer.sku);
		if (!sku) continue;

		const variant = variantFor(sku, storeDomain);
		if (!variant) continue;

		if (sku.digital !== true) digital = false;

		options.push({
			variantId: variant.id,
			label: doseLabel(sku, record(offer.shop_data)),
			price: eur(variant.price),
			therapyDays: therapyDays(sku),
			preSelected: offer.pre_selected === true
		});
	}

	return { options, digital: digital && options.length > 0 };
}

/**
 * Pure, so what the screen may offer can be read without a network call. Products of other
 * shops, unselectable doses, and the nested catalogue graph are dropped here rather than
 * travelling to the browser.
 */
export function toRecommendedPlans(body: unknown, storeDomain: string): RecommendedPlan[] {
	if (!Array.isArray(body)) return [];

	const shop = shopIdentifier(storeDomain);
	const plans: RecommendedPlan[] = [];

	for (const candidate of body) {
		const entry = record(candidate);
		if (!entry) continue;

		const product = record(entry.product);
		if (!product) continue;

		const { options, digital } = offersIn(entry, shop);
		if (options.length === 0) continue;

		const shopData = record(entry.shop_data);

		plans.push({
			id: text(product.uid) || text(product.display_name),
			name: text(product.display_name) || text(shopData?.title) || 'Treatment',
			image: text(record(shopData?.featuredImage)?.url) || null,
			prescriptionOnly: digital,
			options
		});
	}

	return plans;
}

/**
 * Read on entry to the recommendation screen, and only there since 2026-09-04: the order used
 * to read it again to check the variant, and that second read is what made the click take
 * about four seconds.
 *
 * Never cached, which now matters for one caller rather than two: a stale verdict would offer
 * a dose a doctor has since ruled out.
 */
export async function fetchRecommendation(
	anamnesisUid: string,
	storeDomain: string
): Promise<RecommendationResult> {
	const url = recommendationUrl(anamnesisUid);
	if (!url) return { ok: false, reason: 'not-configured' };

	let response: Response;
	try {
		response = await fetch(url, { headers: { accept: 'application/json' } });
	} catch {
		return { ok: false, reason: 'unavailable' };
	}

	if (!response.ok) return { ok: false, reason: 'unavailable' };

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		return { ok: false, reason: 'unavailable' };
	}

	// An empty array is an answer, not a failure: it means nothing was recommended.
	return { ok: true, plans: toRecommendedPlans(body, storeDomain) };
}
