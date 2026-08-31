import type { Page } from '@playwright/test';
import { FIXTURE_IDENTIFIER } from './fixture';

/**
 * The stored-answer key the app writes, restated here rather than imported: a spec that
 * builds the key the same way the app does would not notice the app changing it.
 */
export const FIXTURE_VERSION = '1';

export function answersKey(version: string = FIXTURE_VERSION): string {
	return `solean:questionnaire:${FIXTURE_IDENTIFIER}@${version}`;
}

export function anamnesisKey(version: string = FIXTURE_VERSION): string {
	return `solean:anamnesis:${FIXTURE_IDENTIFIER}@${version}`;
}

/**
 * A step can only be opened once the answers before it are in, so a spec that starts in the
 * middle says what it is starting from. These go in through the same `sessionStorage` key the
 * questionnaire resumes from, which is the path a returning visitor takes.
 */
export const THROUGH_NAME = { FirstName: 'Jonas', Surname: 'Weber' };
export const THROUGH_DOB = { ...THROUGH_NAME, dob: '1990-05-14' };
export const THROUGH_GENDER = { ...THROUGH_DOB, Gender: 'male' };
// A BMI of 28.4, which is what makes the conditions question visible.
export const THROUGH_WEIGHT = { ...THROUGH_GENDER, WeightSize: { size: '178', weight: '90' } };
export const THROUGH_CONDITIONS = {
	...THROUGH_WEIGHT,
	WeightRelatedConditions: ['Knee or hip osteoarthritis']
};
export const THROUGH_ALLERGY = { ...THROUGH_CONDITIONS, allergy: ['none'] };
/** Every question the fixture asks on this branch, so the completion screen is reachable. */
export const EVERY_ANSWER = {
	...THROUGH_ALLERGY,
	WeightlossMedication: 'wegovy',
	WegovySideEffects: 'No'
};

/**
 * The same walk with an e-mail to prefill the checkout with. Separate from `EVERY_ANSWER`
 * because the model does not require one, and the order goes through either way.
 */
export const WITH_EMAIL = { ...EVERY_ANSWER, EMail: 'jonas@example.com' };

/**
 * The two checkout failures, asked for through the buyer's e-mail the way the submission
 * markers work, because the store domain is server configuration a browser cannot vary.
 */
export const REFUSED_CHECKOUT = { ...EVERY_ANSWER, EMail: 'refused@example.com' };
export const UNREACHABLE_CHECKOUT = { ...EVERY_ANSWER, EMail: 'unreachable@example.com' };

/** A session that has already submitted, without going through the submission again. */
export async function seedAnamnesis(
	page: Page,
	uid: string = 'anam-seeded',
	version: string = FIXTURE_VERSION
): Promise<void> {
	await page.addInitScript(
		([key, value]) => {
			window.sessionStorage.setItem(key, value);
		},
		[anamnesisKey(version), uid] as const
	);
}

/**
 * Writes the answers into the page that is already open, rather than into every navigation
 * the way `seedAnswers` does. Use this when the test goes on to change an answer: an init
 * script would put the seeded value back on the next load.
 */
export async function writeAnswers(
	page: Page,
	data: Record<string, unknown>,
	version: string = FIXTURE_VERSION
): Promise<void> {
	await page.evaluate(
		([key, json]) => {
			window.sessionStorage.setItem(key, json);
		},
		[answersKey(version), JSON.stringify(data)] as const
	);
}

export async function seedAnswers(
	page: Page,
	data: Record<string, unknown>,
	version: string = FIXTURE_VERSION
): Promise<void> {
	await page.addInitScript(
		([key, json]) => {
			window.sessionStorage.setItem(key, json);
		},
		[answersKey(version), JSON.stringify(data)] as const
	);
}
