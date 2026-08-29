import type { Answer, QuestionnaireAnswers } from '$lib/domain';
import type {
	MultiSelectStep,
	QuestionnaireProgress,
	QuestionnaireSchema,
	QuestionnaireStep,
	QuestionnaireStepAccess,
	QuestionStep,
	SingleSelectStep,
	ValidationResult
} from './types';

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INVALID_ANSWER_MESSAGE = 'Please choose one of the available options.';

export const QUESTIONNAIRE_START_STEP_ID = 'about-you';

function isQuestionStep(step: QuestionnaireStep): step is QuestionStep {
	return step.kind !== 'interstitial';
}

function hasOptions(step: QuestionStep): step is SingleSelectStep | MultiSelectStep {
	return step.kind === 'single-select' || step.kind === 'multi-select';
}

function defineQuestionnaireSchema(schema: QuestionnaireSchema): QuestionnaireSchema {
	if (!Number.isInteger(schema.questionCount) || schema.questionCount < 1) {
		throw new Error('Questionnaire questionCount must be a positive integer.');
	}

	const stepIds = new Set<string>();
	const questionNumbers = new Set<number>();

	for (const step of schema.steps) {
		if (!SAFE_ID.test(step.id) || stepIds.has(step.id)) {
			throw new Error(`Questionnaire step id must be unique and URL-safe: ${step.id}`);
		}
		stepIds.add(step.id);

		if (!isQuestionStep(step)) continue;
		if (
			!Number.isInteger(step.questionNumber) ||
			step.questionNumber < 1 ||
			step.questionNumber > schema.questionCount ||
			questionNumbers.has(step.questionNumber)
		) {
			throw new Error(`Question number is invalid or duplicated: ${step.questionNumber}`);
		}
		questionNumbers.add(step.questionNumber);

		if (hasOptions(step)) {
			const optionIds = new Set<string>();
			for (const option of step.options) {
				if (!SAFE_ID.test(option.id) || optionIds.has(option.id)) {
					throw new Error(`Question option id must be unique and URL-safe: ${option.id}`);
				}
				optionIds.add(option.id);
			}
		}
	}

	return schema;
}

export const QUESTIONNAIRE_SCHEMA = defineQuestionnaireSchema({
	questionCount: 9,
	steps: [
		{
			id: QUESTIONNAIRE_START_STEP_ID,
			kind: 'single-select',
			questionNumber: 1,
			title: 'Tell us about yourself',
			help: 'We use this to check your eligibility',
			label: 'Biological sex',
			options: [
				{ id: 'female', label: 'Female' },
				{ id: 'male', label: 'Male' }
			],
			validation: [{ type: 'required', message: 'Select an option to continue.' }]
		}
	]
});

export function getQuestionSteps(schema: QuestionnaireSchema): readonly QuestionStep[] {
	return schema.steps.filter(isQuestionStep);
}

export function getQuestionnaireStep(
	schema: QuestionnaireSchema,
	stepId: string
): QuestionnaireStep | null {
	return schema.steps.find((step) => step.id === stepId) ?? null;
}

export function getQuestionnaireProgress(
	schema: QuestionnaireSchema,
	stepId: string
): QuestionnaireProgress | null {
	const stepIndex = schema.steps.findIndex((step) => step.id === stepId);
	if (stepIndex < 0) return null;

	const current =
		[...schema.steps]
			.slice(0, stepIndex + 1)
			.reverse()
			.find(isQuestionStep)?.questionNumber ?? 0;

	return { current, total: schema.questionCount };
}

export function getPreviousQuestionnaireStep(
	schema: QuestionnaireSchema,
	stepId: string
): QuestionnaireStep | null {
	const index = schema.steps.findIndex((step) => step.id === stepId);
	return index > 0 ? schema.steps[index - 1] : null;
}

export function getNextQuestionnaireStep(
	schema: QuestionnaireSchema,
	stepId: string
): QuestionnaireStep | null {
	const index = schema.steps.findIndex((step) => step.id === stepId);
	return index >= 0 ? (schema.steps[index + 1] ?? null) : null;
}

function requiredMessage(step: QuestionStep): string | null {
	return step.validation.find((rule) => rule.type === 'required')?.message ?? null;
}

export function validateQuestionnaireAnswer(
	step: QuestionnaireStep,
	answer: Answer | undefined
): ValidationResult {
	if (!isQuestionStep(step)) return { valid: true };

	if (!answer) {
		const message = requiredMessage(step);
		return message ? { valid: false, message } : { valid: true };
	}

	if (answer.kind !== step.kind) {
		return { valid: false, message: INVALID_ANSWER_MESSAGE };
	}

	if (step.kind === 'single-select' && answer.kind === 'single-select') {
		return step.options.some((option) => option.id === answer.optionId)
			? { valid: true }
			: { valid: false, message: INVALID_ANSWER_MESSAGE };
	}

	if (step.kind === 'multi-select' && answer.kind === 'multi-select') {
		return answer.optionIds.every((optionId) =>
			step.options.some((option) => option.id === optionId)
		)
			? { valid: true }
			: { valid: false, message: INVALID_ANSWER_MESSAGE };
	}

	return { valid: true };
}

export function getFirstUnansweredIndex(
	schema: QuestionnaireSchema,
	answers: QuestionnaireAnswers
): number {
	const questionSteps = getQuestionSteps(schema);
	const index = questionSteps.findIndex(
		(step) => !validateQuestionnaireAnswer(step, answers.byQuestionId[step.id]).valid
	);
	return index < 0 ? questionSteps.length : index;
}

/**
 * The stored marker is untrusted input: session storage outlives a schema edit, so an
 * absent, negative, stale or out-of-range value is replaced by the recomputed one. The
 * original object is returned untouched when it already agrees, keeping reads stable.
 */
export function normalizeQuestionnaireAnswers(
	schema: QuestionnaireSchema,
	answers: QuestionnaireAnswers
): QuestionnaireAnswers {
	const firstUnansweredIndex = getFirstUnansweredIndex(schema, answers);

	return firstUnansweredIndex === answers.firstUnansweredIndex
		? answers
		: { ...answers, firstUnansweredIndex };
}

export function getResumeQuestionnaireStep(
	schema: QuestionnaireSchema,
	answers: QuestionnaireAnswers
): QuestionnaireStep | null {
	const questionSteps = getQuestionSteps(schema);
	if (questionSteps.length === 0) return schema.steps[0] ?? null;

	const firstUnansweredIndex = getFirstUnansweredIndex(schema, answers);
	return questionSteps[firstUnansweredIndex] ?? questionSteps.at(-1) ?? null;
}

export function getQuestionnaireStepAccess(
	schema: QuestionnaireSchema,
	stepId: string,
	answers: QuestionnaireAnswers
): QuestionnaireStepAccess {
	const targetIndex = schema.steps.findIndex((step) => step.id === stepId);
	const resumeStep = getResumeQuestionnaireStep(schema, answers);
	if (targetIndex < 0) {
		return { allowed: false, redirectStepId: resumeStep?.id ?? null };
	}

	const questionSteps = getQuestionSteps(schema);
	const firstUnanswered = questionSteps[getFirstUnansweredIndex(schema, answers)];
	const boundaryIndex = firstUnanswered
		? schema.steps.findIndex((step) => step.id === firstUnanswered.id)
		: schema.steps.length - 1;

	return targetIndex <= boundaryIndex
		? { allowed: true }
		: { allowed: false, redirectStepId: resumeStep?.id ?? null };
}
