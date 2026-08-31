import type { RecommendedPlan } from './recommendation';

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

function isMoney(value: unknown): boolean {
	return isRecord(value) && typeof value.amount === 'number' && value.currency === 'EUR';
}

/**
 * The body is our own endpoint's, and is still validated: a plan that arrives without a
 * variant id or a price would render as a button that cannot buy anything.
 */
function toPlan(value: unknown): RecommendedPlan | null {
	if (!isRecord(value)) return null;
	if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
	if (!Array.isArray(value.options)) return null;

	const options = value.options.filter(
		(option): option is RecommendedPlan['options'][number] =>
			isRecord(option) &&
			typeof option.variantId === 'string' &&
			option.variantId.length > 0 &&
			typeof option.label === 'string' &&
			isMoney(option.price)
	);

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

/** RxScale's own default, and the first option when it names none. */
export function defaultVariant(plans: RecommendedPlan[]): string | null {
	for (const plan of plans) {
		const preSelected = plan.options.find((option) => option.preSelected);
		if (preSelected) return preSelected.variantId;
	}

	return plans[0]?.options[0]?.variantId ?? null;
}
