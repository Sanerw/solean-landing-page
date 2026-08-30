import type { Answer } from '$lib/domain';

/** Field kinds are exactly the answer kinds. `interstitial` is a step kind, never a field. */
export type QuestionFieldKind = Answer['kind'];

export interface RequiredValidationRule {
	type: 'required';
	message: string;
}

/** The typed value could not be read as a number at all, which is not the same as empty. */
export interface NumericValidationRule {
	type: 'numeric';
	message: string;
}

export interface NumericRangeValidationRule {
	type: 'numeric-range';
	min: number;
	max: number;
	integer?: boolean;
	message: string;
}

export interface MinSelectedValidationRule {
	type: 'min-selected';
	count: number;
	message: string;
}

export interface EmailValidationRule {
	type: 'email';
	message: string;
}

export interface MaxLengthValidationRule {
	type: 'max-length';
	max: number;
	message: string;
}

export type ValidationRule =
	| RequiredValidationRule
	| NumericValidationRule
	| NumericRangeValidationRule
	| MinSelectedValidationRule
	| EmailValidationRule
	| MaxLengthValidationRule;

export type ValidationResult = { valid: true } | { valid: false; message: string };

/**
 * One entry per control, so a step reports every failure at once. A contact field holds
 * several inputs, so its keys are `fieldId.inputId`; every other kind keys on `fieldId`.
 */
export interface StepValidationResult {
	valid: boolean;
	byControlId: Record<string, ValidationResult>;
}

export interface QuestionOption {
	id: string;
	label: string;
	description?: string;
	/** Checking it clears every other choice, and any other choice clears it. Multi-select only. */
	exclusive?: boolean;
	/**
	 * Renders below the `OR` separator. The reference puts "None of the above" and "Other"
	 * there together, so being set apart is not the same thing as being exclusive. An
	 * exclusive option is trailing whether or not this is set.
	 */
	trailing?: boolean;
}

interface QuestionFieldBase<K extends QuestionFieldKind> {
	/** Unique within its step. Combined with the step id it addresses one answer. */
	id: string;
	kind: K;
	label: string;
	help?: string;
	/** `half` pairs with the next half-width field on wide viewports, as the reference does. */
	width?: 'full' | 'half';
	/** Kept for assistive technology but not drawn, where the reference shows no group label. */
	labelHidden?: boolean;
	/**
	 * Presentation only. `eyebrow` is the reference's small uppercase field label; `question`
	 * is the bold sentence-case sub-question it uses when a step asks more than one thing.
	 */
	labelStyle?: 'eyebrow' | 'question';
	validation: readonly ValidationRule[];
}

export interface SingleSelectField extends QuestionFieldBase<'single-select'> {
	options: readonly QuestionOption[];
}

export interface MultiSelectField extends QuestionFieldBase<'multi-select'> {
	options: readonly QuestionOption[];
	/** The reference pairs long condition lists into two columns and keeps short ones single. */
	optionColumns?: 1 | 2;
}

export interface NumericField extends QuestionFieldBase<'numeric'> {
	/** Shown beside the input and never typed, so the stored unit cannot disagree with it. */
	unit: string;
	placeholder?: string;
}

export type ContactInputType = 'text' | 'email' | 'tel';

/** Contact is one field holding several inputs, each with its own label, rules and error. */
export interface ContactInput {
	id: string;
	label: string;
	type: ContactInputType;
	/** A real autofill token, so a browser can fill the form; typed to reject a stray string. */
	autocomplete: AutoFill;
	placeholder?: string;
	help?: string;
	width?: 'full' | 'half';
	validation: readonly ValidationRule[];
}

export interface ContactField extends QuestionFieldBase<'contact'> {
	inputs: readonly ContactInput[];
}

export type QuestionField = SingleSelectField | MultiSelectField | NumericField | ContactField;

/** A non-blocking message the reference places between the fields and the action. */
export interface StepNotice {
	variant: 'default' | 'highlighted';
	text: string;
}

export interface QuestionStep {
	kind: 'question';
	id: string;
	questionNumber: number;
	title: string;
	help?: string;
	fields: readonly QuestionField[];
	notice?: StepNotice;
}

export interface InterstitialStep {
	kind: 'interstitial';
	id: string;
	title: string;
	help?: string;
}

export type QuestionnaireStep = QuestionStep | InterstitialStep;

/** Field id to answer. One step can hold several typed answers. */
export type StepAnswers = Record<string, Answer>;

/**
 * What a renderer holds while the user is still working: a chosen option id, a list of
 * them, raw numeric text, or one string per contact input. Kept separate from `Answer`
 * because half-typed input is not yet an answer, and "12a" must be rejectable as a number
 * rather than silently becoming nothing.
 */
export type FieldValue = string | readonly string[] | Readonly<Record<string, string>>;

export type StepValues = Record<string, FieldValue>;

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
