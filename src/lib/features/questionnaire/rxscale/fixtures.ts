import { emptyAnswers, GALLSTONES, type Answers } from '../answers/types';

/**
 * Answer sets for tests, and for tests only.
 *
 * Nothing in the app may import this. It fabricates a complete set of medical answers, and a
 * fabricated medical record shipping to the browser would be worse than useless. Vitest
 * collects `src/**\/*.test.ts`, so this file is not a test suite either; it is a helper the
 * suites share.
 */

/** A complete, eligible visitor: every required question answered, no refusal triggered. */
export function eligibleAnswers(overrides: Partial<Answers> = {}): Answers {
	return {
		...emptyAnswers(),
		gender: 'male',
		dateOfBirth: '1990-04-17',
		heightCm: '180',
		weightKg: '110',
		firstName: 'Jonas',
		lastName: 'Weber',
		email: 'jonas.weber@example.com',
		phone: '+49 151 234 56 78',
		pastMedication: 'never',
		// RxScale refuses everything on this list except gallstones and other, so an eligible
		// visitor answers "none of the above".
		diseases: ['none'],
		familyDiseases: ['none'],
		mentalHealth: 'No',
		eatingDisorder: 'No',
		eatingDisorderStatements: ['none'],
		allergies: ['none'],
		otherMedication: 'no',
		disclaimer: true,
		contraceptionDisclaimer: true,
		...overrides
	};
}

/** The same visitor, on Mounjaro, which opens the dose and side-effect follow-ups. */
export function onMounjaro(overrides: Partial<Answers> = {}): Answers {
	return eligibleAnswers({
		pastMedication: 'mounjaro',
		pastMedicationDose: '2.5 mg',
		pastMedicationDuration: '12',
		pastMedicationLastDose: '2026-08-20',
		hasSideEffects: 'No',
		...overrides
	});
}

/** A female visitor, which opens the two pregnancy questions. */
export function femaleAnswers(overrides: Partial<Answers> = {}): Answers {
	return eligibleAnswers({ gender: 'female', pregnancyStatus: ['none'], ...overrides });
}

/** Gallstones is the one disease RxScale allows, and it opens the gallbladder question. */
export function withGallstones(overrides: Partial<Answers> = {}): Answers {
	return eligibleAnswers({
		diseases: [GALLSTONES],
		gallbladderRemoved: 'Yes',
		...overrides
	});
}
