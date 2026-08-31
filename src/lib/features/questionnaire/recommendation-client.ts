import type { Money } from '$lib/domain';
import type { RecommendedOption, RecommendedPlan } from './recommendation';

/**
 * The browser half of the recommendation. It asks Solean's own endpoint rather than RxScale
 * directly, because the raw document is over a megabyte of catalogue this screen has no use
 * for, and because the same read is what the order is later checked against.
 */

export type { RecommendedOption, RecommendedPlan } from './recommendation';

export type RecommendationFetch =
	| { ok: true; plans: RecommendedPlan[] }
	| { ok: false; reason: 'missing-anamnesis' | 'unavailable' };

type Fetch = typeof globalThis.fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isMoney(value: unknown): value is Money {
	return isRecord(value) && typeof value.amount === 'number' && value.currency === 'EUR';
}

/**
 * The body is our own endpoint's, and is still validated: a plan that arrives without a
 * variant id or a price would render as a button that cannot buy anything. Rebuilt field by
 * field rather than passed through, so nothing the endpoint grows later arrives unread.
 */
function toOption(value: unknown): RecommendedOption | null {
	if (!isRecord(value)) return null;
	if (typeof value.variantId !== 'string' || value.variantId.length === 0) return null;
	if (typeof value.label !== 'string' || !isMoney(value.price)) return null;

	return {
		variantId: value.variantId,
		label: value.label,
		price: value.price,
		therapyDays: typeof value.therapyDays === 'number' ? value.therapyDays : null,
		preSelected: value.preSelected === true
	};
}

function toPlan(value: unknown): RecommendedPlan | null {
	if (!isRecord(value)) return null;
	if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
	if (!Array.isArray(value.options)) return null;

	const options = value.options
		.map(toOption)
		.filter((option): option is RecommendedOption => option !== null);

	if (options.length === 0) return null;

	return {
		id: value.id,
		name: value.name,
		image: typeof value.image === 'string' ? value.image : null,
		prescriptionOnly: value.prescriptionOnly === true,
		options
	};
}

/**
 * Asked once, when the screen appears. An empty list is a result and not a failure: RxScale
 * answering with nothing is what a person whose answers rule out every treatment gets.
 */
export async function fetchRecommendation(
	fetch: Fetch,
	anamnesisUid: string | null
): Promise<RecommendationFetch> {
	if (!anamnesisUid) return { ok: false, reason: 'missing-anamnesis' };

	let response: Response;
	try {
		response = await fetch(`/api/recommendation?anamnesis=${encodeURIComponent(anamnesisUid)}`, {
			headers: { accept: 'application/json' }
		});
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

	const plans = isRecord(body) && Array.isArray(body.plans) ? body.plans : null;
	if (!plans) return { ok: false, reason: 'unavailable' };

	return { ok: true, plans: plans.map(toPlan).filter((plan): plan is RecommendedPlan => plan !== null) };
}
