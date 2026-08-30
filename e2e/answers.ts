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
