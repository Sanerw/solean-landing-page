import type { Money } from '$lib/domain';
import type { RecommendedPlan } from './recommendation';

/**
 * What the choice screen has to decide before it can draw anything: which of the two
 * purchases a plan belongs to, which one arrives selected, and what the confirming button
 * may call it. Kept out of the component because being wrong here costs money: the two
 * groups differ by a factor of six in price and by whether medication is delivered at all.
 */

export type PlanMode = 'treatment' | 'prescription';

export type PlanGroups = Record<PlanMode, RecommendedPlan[]>;

/**
 * A prescription-only listing is a different purchase, not a cheaper version of the same
 * one, so the two never share a list. Splitting them is what keeps 49.90 from being read as
 * a discount on 299.00.
 */
export function groupPlans(plans: readonly RecommendedPlan[]): PlanGroups {
	return {
		treatment: plans.filter((plan) => !plan.prescriptionOnly),
		prescription: plans.filter((plan) => plan.prescriptionOnly)
	};
}

/**
 * Which screen the choice opens on.
 *
 * `treatment` lists the treatments with one card standing for the whole prescription group,
 * and `prescription` lists the medications a prescription can be written for. The second is
 * normally reached by choosing that card, but it is also where a recommendation of nothing but
 * prescriptions starts: a screen whose only option is "prescription only" asks nothing.
 */
export function initialStep(groups: PlanGroups): PlanMode {
	const onlyPrescriptions = groups.treatment.length === 0 && groups.prescription.length > 0;

	return onlyPrescriptions ? 'prescription' : 'treatment';
}

/**
 * What the summary card costs. One price while every listing agrees, which is what the live
 * shop returns today: three prescription-only listings, all 49.90.
 *
 * `from` is not decoration. The card stands for a group, so a single price on a group that
 * disagrees is a promise the next screen breaks, and the lowest is the only one that stays
 * true when it does.
 */
export function groupPrice(plans: readonly RecommendedPlan[]): { price: Money; from: boolean } | null {
	const prices = plans.flatMap((plan) => plan.options.map((option) => option.price));
	if (prices.length === 0) return null;

	const lowest = prices.reduce((min, price) => (price.amount < min.amount ? price : min));

	return { price: lowest, from: prices.some((price) => price.amount !== lowest.amount) };
}

/**
 * Which purchase a chosen variant belongs to, so the analytics mode and the confirming button
 * follow the choice rather than a tab that no longer exists. Null when nothing is chosen or
 * the variant is not among these plans.
 */
export function modeOf(groups: PlanGroups, variantId: string | null): PlanMode | null {
	if (!variantId) return null;

	const holds = (plans: readonly RecommendedPlan[]) =>
		plans.some((plan) => plan.options.some((option) => option.variantId === variantId));

	if (holds(groups.treatment)) return 'treatment';

	return holds(groups.prescription) ? 'prescription' : null;
}

/**
 * Whether confirming the first screen opens the second rather than the checkout. True only
 * when the prescription card is the selection and there is a medication list behind it.
 */
export function opensPrescriptionStep(
	groups: PlanGroups,
	step: PlanMode,
	prescriptionCardChosen: boolean
): boolean {
	return step === 'treatment' && prescriptionCardChosen && groups.prescription.length > 0;
}

/** RxScale's own default, and the first option when it names none. */
export function defaultVariant(plans: readonly RecommendedPlan[]): string | null {
	for (const plan of plans) {
		const preSelected = plan.options.find((option) => option.preSelected);
		if (preSelected) return preSelected.variantId;
	}

	return plans[0]?.options[0]?.variantId ?? null;
}

/**
 * Long enough that a button repeating it would wrap on a phone. Live names run to
 * "Nevolat® - 3 Pens ohne Nadeln", while "Mounjaro®" is already the brand and shortening it
 * would only lose the mark.
 */
const LONG_NAME = 18;

/**
 * The brand a button may name, which is the first word of the product name. Only when no
 * other plan on the screen starts with the same word: "Continue with Wegovy" must not be
 * what a person reads after choosing between two Wegovys.
 */
function shortPlanName(name: string, among: readonly string[]): string {
	const full = name.trim();
	if (full.length <= LONG_NAME) return full;

	const [first] = full.split(/\s+/);
	if (!first) return full;

	const shared = among.some((other) => {
		const candidate = other.trim();

		return candidate !== full && candidate.split(/\s+/)[0] === first;
	});

	return shared ? full : first;
}

/**
 * What the confirming button calls the choice, or null when nothing is chosen or the chosen
 * variant is not among the plans shown. The button says plain "Continue" then, rather than
 * naming merchandise this screen is not offering.
 */
export function chosenPlanName(
	plans: readonly RecommendedPlan[],
	variantId: string | null
): string | null {
	if (!variantId) return null;

	const chosen = plans.find((plan) =>
		plan.options.some((option) => option.variantId === variantId)
	);
	if (!chosen) return null;

	return shortPlanName(
		chosen.name,
		plans.map((plan) => plan.name)
	);
}
