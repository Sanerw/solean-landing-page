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
	/** `Weiblich` opens the pregnancy page; `Männlich` skips it. */
	gender?: 'Weiblich' | 'Männlich';
}

const DEFAULT_EMAIL = 'jonas@example.com';

/**
 * The two checkout failures and the two submission failures are asked for through an answer
 * rather than a side channel, so the request under test stays a real one. The store domain
 * is server configuration a browser cannot vary, which is why the e-mail carries it.
 */
export const REFUSED_CHECKOUT = 'refused@example.com';
export const UNREACHABLE_CHECKOUT = 'unreachable@example.com';
/** The model asks for the address with no validators, so anyone can mistype their way here. */
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
 * The fixture's pages in the order the model shows them, each with what it takes to pass.
 * `page4` is conditional on the gender answer and so is not in the straight line; the walk
 * handles it where it can appear.
 */
const STEPS: { id: string; fill?: (page: Page, options: WalkOptions) => Promise<void> }[] = [
	{
		id: 'page30',
		fill: async (page, options) => {
			await page.getByRole('textbox').fill(options.email ?? DEFAULT_EMAIL);
		}
	},
	{
		id: 'page27',
		fill: async (page) => {
			await page.getByLabel('Bitte gib Deinen Vornamen an.').fill('Jonas');
			await page.getByLabel('Bitte gib Deinen Nachnamen an.').fill('Weber');
		}
	},
	{ id: 'page26', fill: async (page) => selectDateOfBirth(page) },
	{
		id: 'page3',
		fill: async (page, options) => {
			await page.getByRole('radio', { name: options.gender ?? 'Männlich' }).click();
		}
	},
	{
		id: 'page4',
		fill: async (page) => {
			await page.getByRole('radio', { name: 'Nein' }).click();
		}
	},
	{
		id: 'page2',
		fill: async (page) => {
			// A BMI of 28.4, which is what makes the conditions question visible.
			await page.getByLabel('Größe (cm)').fill('178');
			await page.getByLabel('Gewicht (kg)').fill('90');
		}
	},
	{ id: 'projection' },
	{
		id: 'page1',
		fill: async (page) => {
			await page.getByRole('checkbox', { name: 'Knie- oder Hüftarthrose' }).click();
		}
	},
	{
		id: 'page16',
		fill: async (page) => {
			await page.getByRole('checkbox', { name: 'Keine der Genannten' }).click();
		}
	},
	{ id: 'motivation' },
	{
		id: 'page18',
		fill: async (page) => {
			await page.getByRole('radio', { name: 'Andere' }).click();
			await page.getByRole('textbox').fill('Metformin 500mg');
		}
	},
	{
		id: 'page22',
		fill: async (page) => {
			await page.getByRole('radio', { name: 'Ja' }).click();
		}
	},
	{
		id: 'page23',
		fill: async (page) => {
			await page.getByRole('textbox').fill('Leichte Übelkeit in der ersten Woche.');
		}
	}
];

/** The last step, whose Continue is the submission. */
export const LAST_STEP = 'page23';
/** Both completion screens live here. */
export const COMPLETE_STEP = 'complete';

/**
 * A step is not interactive until hydration: validation, branching and navigation all need
 * the engine. Continue being enabled is the honest signal to wait on.
 */
export async function stepIsInteractive(page: Page): Promise<void> {
	await expect(page.getByRole('button', { name: UI.continue })).toBeEnabled();
}

/**
 * Answers from the first question up to `target`, which is left open and unanswered. Pass
 * `complete` to walk the whole thing, which submits on the last Continue.
 *
 * Starts at `/questionnaire` rather than the first page, because that entry is itself part
 * of what a visitor goes through.
 */
export async function walkTo(
	page: Page,
	target: string,
	options: WalkOptions = {}
): Promise<void> {
	await page.goto('/questionnaire');

	for (const step of STEPS) {
		if (step.id === target) {
			await expect(page).toHaveURL(`/questionnaire/${step.id}`);
			await stepIsInteractive(page);
			return;
		}

		// The pregnancy page only appears on one branch, and the walk passes through whichever
		// branch the gender answer opened rather than asserting a fixed line.
		if (step.id === 'page4' && !page.url().endsWith('/page4')) continue;

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
