import { expect, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import { selectDateOfBirth } from './date-picker';

/**
 * Nothing is stored any more, so a spec that starts in the middle has to get there the way a
 * person does: by answering. `walkTo` replaces the seeded `sessionStorage` these specs used
 * to write, and costs a few hundred milliseconds per test for the thing it buys, which is
 * that every step under test is reached through the same validation, branching and
 * navigation a visitor goes through.
 */

export interface WalkOptions {
	/** The first question. A marker address is how a spec asks the fixture to fail. */
	email?: string;
	/**
	 * The one optional field on `your-details`. Left blank by default, because that is how most
	 * walks arrive and the reminder has to be right about both.
	 */
	phone?: string;
	/** `Weiblich` opens the pregnancy screen; `Männlich` skips it. */
	gender?: 'Weiblich' | 'Männlich';
	/**
	 * A BMI inside the 27 to 30 band, which is the only thing that opens
	 * `weight-related-conditions`. The default walk stays at 34, above the band.
	 */
	inTheBmiBand?: boolean;
	/**
	 * Mounjaro rather than "never", which opens the details panel and the `side-effects`
	 * screen after it. Only a medication RxScale tracks a dose for does that.
	 */
	onMedication?: boolean;
	/** Gallstones among the diseases, which is what opens `gallbladder`. */
	hadGallstones?: boolean;
	/**
	 * Exact measurements, for a spec that asserts a number computed from them. `inTheBmiBand`
	 * covers the branch; these cover the arithmetic.
	 */
	heightCm?: string;
	weightKg?: string;
}

const DEFAULT_EMAIL = 'jonas@example.com';

/**
 * The two checkout failures and the two submission failures are asked for through an answer
 * rather than a side channel, so the request under test stays a real one. The store domain
 * is server configuration a browser cannot vary, which is why the e-mail carries it.
 */
export const REFUSED_CHECKOUT = 'refused@example.com';
export const UNREACHABLE_CHECKOUT = 'unreachable@example.com';
/**
 * Our own validation refuses this before anything is sent, which is a change from the model
 * era: RxScale asked for the address with no validators at all.
 */
export const MALFORMED_EMAIL = 'nicht-eine-adresse';

/**
 * The two submission failures, and the two recommendation outcomes that are not a list of
 * plans. All four ride in on an answer, because a browser holds nothing the harness can
 * seed: the uid a session has is the one the submission answered with.
 */
export const REJECTED_SUBMISSION = 'TRIGGER-400';
export const UNAVAILABLE_SUBMISSION = 'TRIGGER-502';
export const NO_PLANS = 'TRIGGER-NO-PLANS@example.com';
export const NO_RECOMMENDATION = 'TRIGGER-NO-RECOMMENDATION@example.com';

/**
 * Our screens, in the order the definition walks them, each with what it takes to pass.
 *
 * From feature 24d the questionnaire is defined in this repository, so these are our screen
 * ids rather than RxScale's model page names, and several of theirs collapse into one of
 * ours: the e-mail and the name share `your-details`, and the sex, date of birth and both
 * measurements share `about-you`.
 *
 * The conditional screens are not on this straight line. `pregnancy` opens for a female
 * visitor and the walk passes through it where it appears; the rest stay closed for the
 * answers below, deliberately, so the default walk is the short one.
 */
const STEPS: { id: string; fill?: (page: Page, options: WalkOptions) => Promise<void> }[] = [
	{
		id: 'about-you',
		fill: async (page, options) => {
			await page.getByRole('radio', { name: options.gender ?? 'Männlich', exact: true }).click();
			await selectDateOfBirth(page);
			// 34 by default, above the band, so the weight-related conditions screen stays
			// closed; 28.4 opens it.
			await page.locator('#q-heightCm').fill(options.heightCm ?? '180');
			await page
				.locator('#q-weightKg')
				.fill(options.weightKg ?? (options.inTheBmiBand ? '92' : '110'));
		}
	},
	{
		id: 'your-details',
		fill: async (page, options) => {
			await page.locator('#q-firstName').fill('Jonas');
			await page.locator('#q-lastName').fill('Weber');
			await page.locator('#q-email').fill(options.email ?? DEFAULT_EMAIL);
			if (options.phone) await page.locator('#q-phone').fill(options.phone);
		}
	},
	{
		id: 'medication-history',
		fill: async (page, options) => {
			if (!options.onMedication) {
				await page
					.getByRole('radio', { name: 'Nein, ich nehme keines dieser Medikamente ein', exact: true })
					.click();
				return;
			}

			// The details panel opens with the medication, and its three questions are required.
			await page.getByRole('radio', { name: 'Mounjaro', exact: true }).click();
			await page.getByRole('radio', { name: '2,5 mg', exact: true }).click();
			await page.locator('#q-pastMedicationDuration').fill('12');
			await page.locator('#q-pastMedicationLastDose').fill('08/2026');
		}
	},
	{
		id: 'side-effects',
		fill: async (page) => {
			await page.getByRole('radio', { name: 'Nein', exact: true }).click();
		}
	},
	{
		id: 'pregnancy',
		fill: async (page) => {
			await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
		}
	},
	{ id: 'projection' },
	{
		id: 'medical-conditions',
		fill: async (page, options) => {
			const label = options.hadGallstones
				? 'Gallensteine, Gallenblasenerkrankung oder Gallenwegserkrankung'
				: 'Keine der Genannten';
			await page.getByRole('checkbox', { name: label, exact: true }).click();
		}
	},
	{
		id: 'gallbladder',
		fill: async (page) => {
			await page.getByRole('radio', { name: 'Nein', exact: true }).click();
		}
	},
	{
		id: 'weight-related-conditions',
		fill: async (page) => {
			await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
		}
	},
	{
		id: 'health-history',
		fill: async (page) => {
			await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
			await page.getByRole('radio', { name: 'Nein', exact: true }).click();
		}
	},
	{
		id: 'eating-disorders',
		fill: async (page) => {
			await page.getByRole('radio', { name: 'Nein', exact: true }).click();
			await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
		}
	},
	{ id: 'motivation' },
	{
		id: 'allergies',
		fill: async (page) => {
			await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
			await page.getByRole('radio', { name: 'Nein', exact: true }).click();
		}
	},
	{
		id: 'disclaimers',
		fill: async (page) => {
			await page.getByRole('checkbox', { name: 'Bestätigen', exact: true }).click();
			await page.getByRole('checkbox', { name: 'Ich verstehe', exact: true }).click();
		}
	}
];

/** The last screen, whose Continue is the submission. */
export const LAST_STEP = 'disclaimers';
/** Both completion screens live here. */
export const COMPLETE_STEP = 'complete';

/** Screens only a branch opens, which the straight walk steps over when they are closed. */
const CONDITIONAL_STEPS = new Set(['pregnancy', 'weight-related-conditions', 'side-effects', 'gallbladder']);

/**
 * A step is not interactive until hydration: validation, branching and navigation are all
 * client-side. Continue being enabled is the honest signal to wait on.
 */
export async function stepIsInteractive(page: Page): Promise<void> {
	await expect(page.getByRole('button', { name: UI.continue })).toBeEnabled();
}

/**
 * Forget any questionnaire this browser has stored.
 *
 * Answers survive a reload and a return visit from feature 24e, which is a feature and also a
 * way for one test to inherit another's session: two walks in the same test would find the
 * first one waiting and resume it instead of starting. A walk means starting, so it says so.
 * The specs that are about resuming clear nothing and navigate instead.
 */
export async function startFresh(page: Page): Promise<void> {
	// Storage is per origin, so the page has to be on it before there is anything to clear.
	if (new URL(page.url()).hostname === 'localhost') {
		await page.evaluate(() => window.localStorage.clear());
	}
}

/**
 * Answers from the first screen up to `target`, which is left open and unanswered. Pass
 * `complete` to walk the whole thing, which submits on the last Continue.
 *
 * Starts at `/questionnaire` rather than the first screen, because that entry is itself part
 * of what a visitor goes through.
 */
export async function walkTo(
	page: Page,
	target: string,
	options: WalkOptions = {}
): Promise<void> {
	await startFresh(page);
	await page.goto('/questionnaire');

	for (const step of STEPS) {
		if (step.id === target) {
			await expect(page).toHaveURL(`/questionnaire/${step.id}`);
			await stepIsInteractive(page);
			return;
		}

		// A screen the answers did not open is simply not where the visitor is.
		if (CONDITIONAL_STEPS.has(step.id) && !page.url().endsWith(`/${step.id}`)) continue;

		await expect(page).toHaveURL(`/questionnaire/${step.id}`);
		await stepIsInteractive(page);
		await step.fill?.(page, options);
		await page.getByRole('button', { name: UI.continue }).click();
	}

	await expect(page).toHaveURL(`/questionnaire/${COMPLETE_STEP}`);
}

/** The whole questionnaire, ending on the completion step with the anamnesis submitted. */
export async function walkAndSubmit(page: Page, options: WalkOptions = {}): Promise<void> {
	await walkTo(page, COMPLETE_STEP, options);
}
