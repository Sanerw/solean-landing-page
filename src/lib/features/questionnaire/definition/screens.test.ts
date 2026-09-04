import { describe, expect, it } from 'vitest';
import { GALLSTONES, emptyAnswers, type Answers } from '../answers/types';
import { QUESTIONS } from './questions';
import { SCREENS, buildWalk, visibleQuestions, visibleScreens } from './screens';

function answering(overrides: Partial<Answers>): Answers {
	return { ...emptyAnswers(), ...overrides };
}

/** Answer sets that between them open and close every branch in the definition. */
const SCENARIOS: Record<string, Answers> = {
	blank: emptyAnswers(),
	maleOverweight: answering({ gender: 'male', heightCm: '180', weightKg: '110' }),
	femaleInTheBand: answering({ gender: 'female', heightCm: '180', weightKg: '92' }),
	onWegovyWithSideEffects: answering({
		gender: 'male',
		heightCm: '180',
		weightKg: '110',
		pastMedication: 'wegovy',
		hasSideEffects: 'Yes'
	}),
	withGallstones: answering({ gender: 'male', diseases: [GALLSTONES] }),
	everythingOpen: answering({
		gender: 'female',
		heightCm: '180',
		weightKg: '92',
		pastMedication: 'mounjaro',
		hasSideEffects: 'Yes',
		diseases: [GALLSTONES],
		otherMedication: 'yes'
	})
};

describe('SCREENS', () => {
	it('walks twelve screens', () => {
		expect(SCREENS).toHaveLength(12);
	});

	it('uses each screen id once, and each question exactly once', () => {
		const ids = SCREENS.map((screen) => screen.id);
		const questionIds = SCREENS.flatMap((screen) => screen.questionIds);

		expect(new Set(ids).size).toBe(ids.length);
		expect(new Set(questionIds).size).toBe(questionIds.length);
		expect(questionIds).toHaveLength(QUESTIONS.length);
	});

	it('places every defined question on a screen', () => {
		const placed = new Set(SCREENS.flatMap((screen) => screen.questionIds));

		for (const question of QUESTIONS) {
			expect(placed.has(question.id), question.id).toBe(true);
		}
	});
});

describe('visibleScreens', () => {
	it('shows the unconditional screens to everyone, including someone who has answered nothing', () => {
		const shown = visibleScreens(emptyAnswers()).map((screen) => screen.id);

		expect(shown).toContain('about-you');
		expect(shown).toContain('disclaimers');
	});

	it('gates the four conditional screens', () => {
		const forMale = visibleScreens(SCENARIOS.maleOverweight).map((screen) => screen.id);

		expect(forMale).not.toContain('pregnancy');
		expect(forMale).not.toContain('side-effects');
		expect(forMale).not.toContain('gallbladder');
		// BMI 33.95, above the band RxScale asks about.
		expect(forMale).not.toContain('weight-related-conditions');
	});

	it('opens each conditional screen for the answers that call for it', () => {
		expect(visibleScreens(SCENARIOS.femaleInTheBand).map((s) => s.id)).toContain('pregnancy');
		// BMI 28.4, inside the band.
		expect(visibleScreens(SCENARIOS.femaleInTheBand).map((s) => s.id)).toContain(
			'weight-related-conditions'
		);
		expect(visibleScreens(SCENARIOS.onWegovyWithSideEffects).map((s) => s.id)).toContain(
			'side-effects'
		);
		expect(visibleScreens(SCENARIOS.withGallstones).map((s) => s.id)).toContain('gallbladder');
	});

	it('never shows a screen with nothing left to ask', () => {
		// A screen's own rule has to be enough on its own. If every question on a shown screen
		// were hidden, the visitor would meet a page with a heading and no question, and the
		// definition, not the renderer, would be at fault.
		for (const [name, answers] of Object.entries(SCENARIOS)) {
			for (const screen of visibleScreens(answers)) {
				expect(visibleQuestions(screen, answers).length, `${name}/${screen.id}`).toBeGreaterThan(0);
			}
		}
	});
});

describe('visibleQuestions', () => {
	const medicationHistory = SCREENS.find((screen) => screen.id === 'medication-history')!;

	it('asks only which medication until one is named', () => {
		const asked = visibleQuestions(medicationHistory, emptyAnswers()).map((q) => q.id);

		expect(asked).toEqual(['pastMedication']);
	});

	it('adds the follow-ups once a tracked medication is named', () => {
		const asked = visibleQuestions(
			medicationHistory,
			answering({ pastMedication: 'mounjaro' })
		).map((q) => q.id);

		expect(asked).toEqual([
			'pastMedication',
			'pastMedicationDose',
			'pastMedicationDuration',
			'pastMedicationLastDose'
		]);
	});

	it('keeps the follow-ups away from a medication RxScale asks no dose for', () => {
		const asked = visibleQuestions(medicationHistory, answering({ pastMedication: 'never' })).map(
			(q) => q.id
		);

		expect(asked).toEqual(['pastMedication']);
	});
});

describe('buildWalk', () => {
	it('counts screens, never interludes', () => {
		const walk = buildWalk(SCENARIOS.everythingOpen);
		const screens = walk.steps.filter((step) => step.kind === 'screen');
		const interludes = walk.steps.filter((step) => step.kind === 'interlude');

		expect(walk.screenTotal).toBe(screens.length);
		expect(interludes.length).toBeGreaterThan(0);
		expect(walk.screenTotal).toBeLessThan(walk.steps.length);
	});

	it('numbers screens consecutively from one, whichever branches are open', () => {
		for (const [name, answers] of Object.entries(SCENARIOS)) {
			const numbers = buildWalk(answers)
				.steps.filter((step) => step.kind === 'screen')
				.map((step) => step.screenNumber);

			expect(numbers, name).toEqual(numbers.map((_, index) => index + 1));
		}
	});

	it('raises the total when a branch opens, because those screens are now theirs to answer', () => {
		expect(buildWalk(SCENARIOS.everythingOpen).screenTotal).toBeGreaterThan(
			buildWalk(SCENARIOS.maleOverweight).screenTotal
		);
	});

	it('shows both interludes to every visitor, since neither sits on a conditional screen', () => {
		for (const [name, answers] of Object.entries(SCENARIOS)) {
			const variants = buildWalk(answers)
				.steps.filter((step) => step.kind === 'interlude')
				.map((step) => step.variant);

			expect(variants, name).toEqual(['projection', 'motivation']);
		}
	});
});
