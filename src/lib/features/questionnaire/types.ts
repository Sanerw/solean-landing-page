import type { Answer } from '$lib/domain';

export type AnswerQuestionKind = Answer['kind'];
export type QuestionKind = AnswerQuestionKind | 'interstitial';

export interface RequiredValidationRule {
	type: 'required';
	message: string;
}

export type ValidationRule = RequiredValidationRule;

export type ValidationResult = { valid: true } | { valid: false; message: string };

export interface QuestionOption {
	id: string;
	label: string;
	description?: string;
	exclusive?: boolean;
}

interface QuestionStepBase<K extends AnswerQuestionKind> {
	id: string;
	kind: K;
	questionNumber: number;
	title: string;
	help?: string;
	validation: readonly ValidationRule[];
}

export interface SingleSelectStep extends QuestionStepBase<'single-select'> {
	label: string;
	options: readonly QuestionOption[];
}

export interface MultiSelectStep extends QuestionStepBase<'multi-select'> {
	label: string;
	options: readonly QuestionOption[];
}

export interface NumericStep extends QuestionStepBase<'numeric'> {
	label: string;
}

export interface ContactStep extends QuestionStepBase<'contact'> {}

export type QuestionStep = SingleSelectStep | MultiSelectStep | NumericStep | ContactStep;

export interface InterstitialStep {
	id: string;
	kind: 'interstitial';
	title: string;
	help?: string;
}

export type QuestionnaireStep = QuestionStep | InterstitialStep;

export interface QuestionnaireSchema {
	questionCount: number;
	steps: readonly QuestionnaireStep[];
}

export interface QuestionnaireProgress {
	current: number;
	total: number;
}

export type QuestionnaireStepAccess =
	| { allowed: true }
	| { allowed: false; redirectStepId: string | null };
