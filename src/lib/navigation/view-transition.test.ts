import { describe, expect, it } from 'vitest';
import { entersQuestionnaire } from './view-transition';

const HOME = '/(marketing)';
const ARTICLE = '/(marketing)/learn/blog/[slug]';
const ENTRY = '/(questionnaire)/questionnaire';
const STEP = '/(questionnaire)/questionnaire/[step]';

describe('entersQuestionnaire', () => {
	it('crosses from the landing page into the funnel', () => {
		expect(entersQuestionnaire(HOME, ENTRY)).toBe(true);
	});

	it('crosses from an article too, because any marketing page is the same cut', () => {
		expect(entersQuestionnaire(ARTICLE, STEP)).toBe(true);
	});

	it('is false between two steps, which already animate on their own', () => {
		expect(entersQuestionnaire(STEP, STEP)).toBe(false);
	});

	it('is false from the funnel entry into a step', () => {
		expect(entersQuestionnaire(ENTRY, STEP)).toBe(false);
	});

	it('is false leaving the funnel', () => {
		expect(entersQuestionnaire(STEP, HOME)).toBe(false);
	});

	it('is false without a route to come from', () => {
		expect(entersQuestionnaire(null, STEP)).toBe(false);
		expect(entersQuestionnaire(undefined, STEP)).toBe(false);
	});

	it('is false when the destination route is unknown', () => {
		expect(entersQuestionnaire(HOME, null)).toBe(false);
	});
});
