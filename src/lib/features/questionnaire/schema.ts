import type { Answer, QuestionnaireAnswers } from '$lib/domain';
import type {
	ContactField,
	ContactInput,
	FieldValue,
	MultiSelectField,
	QuestionField,
	QuestionnaireProgress,
	QuestionnaireSchema,
	QuestionnaireStep,
	QuestionnaireStepAccess,
	QuestionStep,
	SingleSelectField,
	StepAnswers,
	StepValidationResult,
	StepValues,
	ValidationResult,
	ValidationRule
} from './types';

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INVALID_ANSWER_MESSAGE = 'Please choose one of the available options.';

export const QUESTIONNAIRE_START_STEP_ID = 'about-you';

function isQuestionStep(step: QuestionnaireStep): step is QuestionStep {
	return step.kind === 'question';
}

function hasOptions(field: QuestionField): field is SingleSelectField | MultiSelectField {
	return field.kind === 'single-select' || field.kind === 'multi-select';
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

		if (step.fields.length === 0) {
			throw new Error(`An answer-producing step must have at least one field: ${step.id}`);
		}

		const fieldIds = new Set<string>();
		for (const field of step.fields) {
			if (!SAFE_ID.test(field.id) || fieldIds.has(field.id)) {
				throw new Error(`Question field id must be unique within its step: ${field.id}`);
			}
			fieldIds.add(field.id);

			if (!hasOptions(field)) continue;

			const optionIds = new Set<string>();
			for (const option of field.options) {
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
	// 8, not the reference's 9. Eight artboards ask a question and the ninth congratulates,
	// so "QUESTION n OF 9" was the defect and "ALL 8 STEPS COMPLETE" was right. Project plan
	// section 9 rules that one count exists and the schema owns it; this is that count, and
	// the completion screen is never numbered.
	questionCount: 8,
	steps: [
		{
			kind: 'question',
			id: QUESTIONNAIRE_START_STEP_ID,
			questionNumber: 1,
			title: 'Tell us about yourself',
			help: 'We use this to check your eligibility',
			fields: [
				{
					id: 'biological-sex',
					kind: 'single-select',
					label: 'Biological sex',
					options: [
						{ id: 'female', label: 'Female' },
						{ id: 'male', label: 'Male' }
					],
					validation: [{ type: 'required', message: 'Select an option to continue.' }]
				},
				{
					id: 'height',
					kind: 'numeric',
					label: 'Height',
					width: 'half',
					unit: 'cm',
					placeholder: '178',
					validation: [
						{ type: 'required', message: 'Enter your height.' },
						{ type: 'numeric', message: 'Height must be a number.' },
						{
							type: 'numeric-range',
							min: 120,
							max: 230,
							integer: true,
							message: 'Height must be a whole number between 120 and 230 cm.'
						}
					]
				},
				{
					id: 'weight',
					kind: 'numeric',
					label: 'Weight',
					width: 'half',
					unit: 'kg',
					placeholder: '96',
					validation: [
						{ type: 'required', message: 'Enter your weight.' },
						{ type: 'numeric', message: 'Weight must be a number.' },
						{
							type: 'numeric-range',
							min: 40,
							max: 300,
							message: 'Weight must be between 40 and 300 kg.'
						}
					]
				}
			]
		},
		{
			kind: 'question',
			id: 'your-details',
			questionNumber: 2,
			title: "Let's save your progress",
			help: 'So you can pick up right where you left off, anytime',
			fields: [
				{
					id: 'contact',
					kind: 'contact',
					label: 'Your details',
					// The reference labels each input and shows no heading over the group.
					labelHidden: true,
					validation: [],
					inputs: [
						{
							id: 'first-name',
							label: 'First name',
							type: 'text',
							autocomplete: 'given-name',
							width: 'half',
							validation: [
								{ type: 'required', message: 'Enter your first name.' },
								{ type: 'max-length', max: 60, message: 'First name is too long.' }
							]
						},
						{
							id: 'last-name',
							label: 'Last name',
							type: 'text',
							autocomplete: 'family-name',
							width: 'half',
							validation: [
								{ type: 'required', message: 'Enter your last name.' },
								{ type: 'max-length', max: 60, message: 'Last name is too long.' }
							]
						},
						{
							id: 'email',
							label: 'E-mail address',
							type: 'email',
							autocomplete: 'email',
							placeholder: 'name@example.com',
							validation: [
								{ type: 'required', message: 'Enter your e-mail address.' },
								{
									type: 'email',
									message: 'Enter an e-mail address in the form name@example.com.'
								},
								{ type: 'max-length', max: 254, message: 'E-mail address is too long.' }
							]
						},
						{
							id: 'phone',
							label: 'Phone number, optional',
							type: 'tel',
							autocomplete: 'tel',
							placeholder: '+49 151 234 56 78',
							help: 'Get order updates, exclusive discounts and tips by SMS. Opt out anytime.',
							validation: [{ type: 'max-length', max: 32, message: 'Phone number is too long.' }]
						}
					]
				}
			],
			notice: {
				variant: 'default',
				text: "We'll email you a secure link so you can continue where you left off."
			}
		},
		{
			kind: 'question',
			id: 'pregnancy',
			questionNumber: 3,
			title: 'Are you pregnant, breastfeeding, or planning a pregnancy?',
			help: 'Select all that apply',
			fields: [
				{
					id: 'pregnancy-status',
					kind: 'multi-select',
					label: 'Pregnancy status',
					labelHidden: true,
					options: [
						{ id: 'pregnant', label: 'I am currently pregnant' },
						{ id: 'breastfeeding', label: 'I am breastfeeding' },
						{ id: 'planning', label: 'I am planning a pregnancy in the next 2 months' },
						{ id: 'none', label: 'None of these', exclusive: true }
					],
					validation: [
						{ type: 'required', message: 'Choose an option, or select "None of these".' },
						{ type: 'min-selected', count: 1, message: 'Choose at least one option.' }
					]
				}
			],
			notice: {
				variant: 'default',
				text: 'The medication must be stopped at least 2 months before a planned pregnancy.'
			}
		},
		{
			kind: 'question',
			id: 'medical-conditions',
			questionNumber: 4,
			title: 'Do you have any of the following conditions?',
			help: 'Select all that apply',
			fields: [
				{
					id: 'conditions',
					kind: 'multi-select',
					label: 'Medical conditions',
					labelHidden: true,
					optionColumns: 2,
					// Column order in the reference reads down the left column, then the right.
					options: [
						{ id: 'thyroid-cancer', label: 'Thyroid cancer' },
						{ id: 'pancreatitis', label: 'Pancreatitis or pancreatic disease' },
						{ id: 'gallstones', label: 'Gallstones or gallbladder disease' },
						{ id: 'liver-disease', label: 'Liver disease (except fatty liver)' },
						{ id: 'kidney-disease', label: 'Kidney disease' },
						{ id: 'diabetic-retinopathy', label: 'Diabetic retinopathy' },
						{ id: 'tachycardia', label: 'Tachycardia or heart rhythm disorders' },
						{ id: 'mental-health', label: 'Serious mental health conditions' },
						{ id: 'insulin-sulfonylureas', label: 'Use of insulin or sulfonylureas' },
						{ id: 'heart-failure', label: 'Heart failure' },
						{ id: 'recent-weight-loss-surgery', label: 'Weight loss surgery in the last 3 months' },
						{ id: 'type-1-diabetes', label: 'Type 1 diabetes' },
						{ id: 'endocrine-disorders', label: 'Endocrine or thyroid disorders' },
						{ id: 'porphyria', label: 'Porphyria' },
						{ id: 'inflammatory-bowel-disease', label: 'Inflammatory bowel disease' },
						{ id: 'severe-gi-disorders', label: 'Severe GI disorders (gastroparesis)' },
						{ id: 'none', label: 'None of the above', exclusive: true },
						// Trailing but not exclusive: the reference sets it beside "None of the
						// above" while still allowing it alongside a listed condition.
						{ id: 'other', label: 'Other', trailing: true }
					],
					validation: [
						{ type: 'required', message: 'Choose an option, or select "None of the above".' },
						{ type: 'min-selected', count: 1, message: 'Choose at least one option.' }
					]
				}
			]
		},
		{
			kind: 'question',
			id: 'health-history',
			questionNumber: 5,
			title: 'A few questions about your health history',
			fields: [
				{
					id: 'family-history',
					kind: 'multi-select',
					label: 'Have you or a family member ever had any of the following?',
					labelStyle: 'question',
					options: [
						{ id: 'medullary-thyroid-carcinoma', label: 'Medullary thyroid carcinoma' },
						{ id: 'multiple-endocrine-neoplasia', label: 'Multiple endocrine neoplasia' },
						{ id: 'none', label: 'None of the above', exclusive: true }
					],
					validation: [
						{ type: 'required', message: 'Choose an option, or select "None of the above".' },
						{ type: 'min-selected', count: 1, message: 'Choose at least one option.' }
					]
				},
				{
					id: 'mental-health',
					kind: 'single-select',
					label: 'Have you been diagnosed with a mental health condition or had suicidal thoughts?',
					labelStyle: 'question',
					options: [
						{ id: 'yes', label: 'Yes' },
						{ id: 'no', label: 'No' }
					],
					validation: [{ type: 'required', message: 'Select Yes or No to continue.' }]
				}
			]
		},
		{
			kind: 'question',
			id: 'eating-disorders',
			questionNumber: 6,
			title: 'Do you currently have, or have you ever had, an eating disorder?',
			// The reference joins these with an em dash, which the writing rule excludes.
			help: 'Anorexia, bulimia, binge eating or similar. Please select Yes even if it was never medically confirmed.',
			fields: [
				{
					id: 'eating-disorder',
					kind: 'single-select',
					// The h1 already asks this, so the group name exists only for assistive technology.
					label: 'Eating disorder history',
					labelHidden: true,
					options: [
						{ id: 'yes', label: 'Yes' },
						{ id: 'no', label: 'No' }
					],
					validation: [{ type: 'required', message: 'Select Yes or No to continue.' }]
				},
				{
					id: 'statements',
					kind: 'multi-select',
					label: 'Do any of these statements apply to you?',
					labelStyle: 'question',
					options: [
						{ id: 'vomiting', label: 'I have made myself vomit after feeling uncomfortably full' },
						{ id: 'losing-control', label: 'I worry about losing control over how much I eat' },
						{ id: 'recent-loss', label: 'I have lost more than 6 kg in the past 3 months' },
						{ id: 'body-image', label: 'I believe I am fat even when others say I am too thin' },
						{ id: 'dominated-by-food', label: 'My life is dominated by food' },
						{ id: 'none', label: 'None of the above', exclusive: true }
					],
					validation: [
						{ type: 'required', message: 'Choose an option, or select "None of the above".' },
						{ type: 'min-selected', count: 1, message: 'Choose at least one option.' }
					]
				}
			]
		},
		{
			kind: 'question',
			id: 'allergies-medications',
			questionNumber: 7,
			title: 'Are you allergic to any substances, medications or foods?',
			help: 'Select all that apply',
			fields: [
				{
					id: 'allergies',
					kind: 'multi-select',
					label: 'Allergies',
					labelHidden: true,
					optionColumns: 2,
					options: [
						{ id: 'liraglutide', label: 'Liraglutide' },
						{ id: 'semaglutide', label: 'Semaglutide' },
						{ id: 'tirzepatide', label: 'Tirzepatide' },
						{ id: 'benzyl-alcohol', label: 'Benzyl alcohol' },
						{ id: 'disodium-phosphate-dihydrate', label: 'Disodium phosphate dihydrate' },
						{ id: 'propylene-glycol', label: 'Propylene glycol' },
						{ id: 'phenol', label: 'Phenol' },
						{ id: 'hydrochloric-acid-sodium-hydroxide', label: 'Hydrochloric acid / sodium hydroxide' },
						{ id: 'none', label: 'None of the above', exclusive: true },
						{ id: 'other', label: 'Other', trailing: true }
					],
					validation: [
						{ type: 'required', message: 'Choose an option, or select "None of the above".' },
						{ type: 'min-selected', count: 1, message: 'Choose at least one option.' }
					]
				},
				{
					id: 'other-medication',
					kind: 'single-select',
					label: 'Do you take any other medication, including prescription and over-the-counter?',
					labelStyle: 'question',
					help: 'The medication delays gastric emptying and could affect the absorption of oral medication taken at the same time.',
					options: [
						{ id: 'yes', label: 'Yes' },
						{ id: 'no', label: 'No' }
					],
					validation: [{ type: 'required', message: 'Select Yes or No to continue.' }]
				}
			]
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

function ruleMessage(field: QuestionField, type: ValidationRule['type']): string | null {
	return field.validation.find((rule) => rule.type === type)?.message ?? null;
}

/**
 * The one place a field's rules are applied. `malformed` means the user typed something
 * this kind cannot represent at all, which is a different failure from leaving it empty.
 */
function checkField(
	field: QuestionField,
	answer: Answer | undefined,
	malformed: boolean
): ValidationResult {
	if (malformed) {
		return { valid: false, message: ruleMessage(field, 'numeric') ?? INVALID_ANSWER_MESSAGE };
	}

	if (!answer) {
		const message = ruleMessage(field, 'required');
		return message ? { valid: false, message } : { valid: true };
	}

	if (answer.kind !== field.kind) {
		return { valid: false, message: INVALID_ANSWER_MESSAGE };
	}

	if (field.kind === 'single-select' && answer.kind === 'single-select') {
		return field.options.some((option) => option.id === answer.optionId)
			? { valid: true }
			: { valid: false, message: INVALID_ANSWER_MESSAGE };
	}

	if (field.kind === 'multi-select' && answer.kind === 'multi-select') {
		if (!answer.optionIds.every((optionId) => field.options.some((option) => option.id === optionId))) {
			return { valid: false, message: INVALID_ANSWER_MESSAGE };
		}

		const minSelected = field.validation.find((rule) => rule.type === 'min-selected');
		if (minSelected && answer.optionIds.length < minSelected.count) {
			return { valid: false, message: minSelected.message };
		}
	}

	if (field.kind === 'numeric' && answer.kind === 'numeric') {
		const range = field.validation.find((rule) => rule.type === 'numeric-range');
		if (range) {
			const outOfRange = answer.value < range.min || answer.value > range.max;
			const notWhole = range.integer === true && !Number.isInteger(answer.value);
			if (outOfRange || notWhole) return { valid: false, message: range.message };
		}
	}

	return { valid: true };
}

/** Validates a stored answer. Resume and progress read persisted state, never form input. */
export function validateQuestionField(
	field: QuestionField,
	answer: Answer | undefined
): ValidationResult {
	return checkField(field, answer, false);
}

// Deliberately permissive: one @, something either side, a dot in the domain. A stricter
// pattern rejects addresses that are legal, and this is a prototype, not a mail server.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkContactInput(input: ContactInput, raw: string): ValidationResult {
	const value = raw.trim();

	if (value === '') {
		const message = input.validation.find((rule) => rule.type === 'required')?.message;
		return message ? { valid: false, message } : { valid: true };
	}

	for (const rule of input.validation) {
		if (rule.type === 'max-length' && value.length > rule.max) {
			return { valid: false, message: rule.message };
		}
		if (rule.type === 'email' && !EMAIL.test(value)) {
			return { valid: false, message: rule.message };
		}
	}

	return { valid: true };
}

/** `fieldId.inputId` for a contact input, plain `fieldId` for every other kind. */
export function controlId(fieldId: string, inputId?: string): string {
	return inputId === undefined ? fieldId : `${fieldId}.${inputId}`;
}

export function emptyFieldValue(field: QuestionField): FieldValue {
	switch (field.kind) {
		case 'multi-select':
			return [];
		case 'contact':
			return Object.fromEntries(field.inputs.map((input) => [input.id, '']));
		default:
			return '';
	}
}

export function fieldValueFromAnswer(field: QuestionField, answer: Answer | undefined): FieldValue {
	if (!answer || answer.kind !== field.kind) return emptyFieldValue(field);

	switch (answer.kind) {
		case 'single-select':
			return answer.optionId;
		case 'multi-select':
			return answer.optionIds;
		case 'numeric':
			return String(answer.value);
		case 'contact':
			// Narrowed by kind above, so the empty value for a contact field is always a record.
			return { ...(emptyFieldValue(field) as Record<string, string>), ...answer.fields };
	}
}

interface FieldDraft {
	answer: Answer | undefined;
	malformed: boolean;
}

function draftFromValue(field: QuestionField, value: FieldValue): FieldDraft {
	switch (field.kind) {
		case 'single-select': {
			const optionId = typeof value === 'string' ? value : '';
			return { answer: optionId ? { kind: 'single-select', optionId } : undefined, malformed: false };
		}
		case 'multi-select': {
			const selected = new Set(Array.isArray(value) ? value : []);
			// Ordered by the schema, not by when each box was ticked, so a restored answer
			// always renders the same way.
			const optionIds = field.options
				.filter((option) => selected.has(option.id))
				.map((option) => option.id);

			return {
				answer: optionIds.length > 0 ? { kind: 'multi-select', optionIds } : undefined,
				malformed: false
			};
		}
		case 'contact': {
			const record = typeof value === 'object' && !Array.isArray(value) ? value : {};
			const fields: Record<string, string> = {};
			for (const input of field.inputs) {
				const entry = (record as Record<string, string>)[input.id]?.trim() ?? '';
				if (entry !== '') fields[input.id] = entry;
			}

			return {
				answer: Object.keys(fields).length > 0 ? { kind: 'contact', fields } : undefined,
				malformed: false
			};
		}
		case 'numeric': {
			const raw = typeof value === 'string' ? value.trim() : '';
			if (raw === '') return { answer: undefined, malformed: false };

			// Number('') and Number(' ') are 0, which is why the empty case is handled first.
			const parsed = Number(raw);
			if (!Number.isFinite(parsed)) return { answer: undefined, malformed: true };

			return { answer: { kind: 'numeric', value: parsed, unit: field.unit }, malformed: false };
		}
		default:
			return { answer: undefined, malformed: false };
	}
}

export function fieldValueToAnswer(field: QuestionField, value: FieldValue): Answer | undefined {
	return draftFromValue(field, value).answer;
}

/** Validates live form input, so a half-typed value is judged before it becomes an answer. */
export function validateFieldValue(field: QuestionField, value: FieldValue): ValidationResult {
	const draft = draftFromValue(field, value);
	return checkField(field, draft.answer, draft.malformed);
}

export function validateStepValues(
	step: QuestionnaireStep,
	values: StepValues
): StepValidationResult {
	if (!isQuestionStep(step)) return { valid: true, byControlId: {} };

	const byControlId: Record<string, ValidationResult> = {};
	for (const field of step.fields) {
		const value = values[field.id] ?? emptyFieldValue(field);

		if (field.kind === 'contact') {
			const record = (typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<
				string,
				string
			>;
			for (const input of field.inputs) {
				byControlId[controlId(field.id, input.id)] = checkContactInput(input, record[input.id] ?? '');
			}
			continue;
		}

		byControlId[field.id] = validateFieldValue(field, value);
	}

	return { valid: Object.values(byControlId).every((result) => result.valid), byControlId };
}

export function stepValuesToAnswers(step: QuestionStep, values: StepValues): StepAnswers {
	const answers: StepAnswers = {};
	for (const field of step.fields) {
		const answer = fieldValueToAnswer(field, values[field.id] ?? emptyFieldValue(field));
		if (answer) answers[field.id] = answer;
	}
	return answers;
}

function contactValues(field: ContactField, answer: Answer | undefined): Record<string, string> {
	return answer?.kind === 'contact' ? answer.fields : {};
}

export function validateQuestionnaireStep(
	step: QuestionnaireStep,
	answers: StepAnswers | undefined
): StepValidationResult {
	if (!isQuestionStep(step)) return { valid: true, byControlId: {} };

	const byControlId: Record<string, ValidationResult> = {};
	for (const field of step.fields) {
		if (field.kind === 'contact') {
			const values = contactValues(field, answers?.[field.id]);
			for (const input of field.inputs) {
				byControlId[controlId(field.id, input.id)] = checkContactInput(input, values[input.id] ?? '');
			}
			continue;
		}

		byControlId[field.id] = validateQuestionField(field, answers?.[field.id]);
	}

	return { valid: Object.values(byControlId).every((result) => result.valid), byControlId };
}

export function getFirstUnansweredIndex(
	schema: QuestionnaireSchema,
	answers: QuestionnaireAnswers
): number {
	const questionSteps = getQuestionSteps(schema);
	const index = questionSteps.findIndex(
		(step) => !validateQuestionnaireStep(step, answers.byQuestionId[step.id]).valid
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
