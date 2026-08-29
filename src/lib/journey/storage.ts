import { browser } from '$app/environment';
import type { Answer, PatientDetails, QuestionnaireAnswers, ShippingAddress } from '$lib/domain';
import { SESSION_VERSION, type JourneySession } from './session';

const STORAGE_KEY = 'solean.journey';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNullableString(value: unknown): value is string | null {
	return value === null || typeof value === 'string';
}

function isNullOr<T>(value: unknown, check: (candidate: unknown) => candidate is T): value is T | null {
	return value === null || check(value);
}

/** The tagged union is what lets a persisted answer be validated without feature 7's schema. */
function isAnswer(value: unknown): value is Answer {
	if (!isRecord(value)) return false;

	switch (value.kind) {
		case 'single-select':
			return typeof value.optionId === 'string';
		case 'multi-select':
			return isStringArray(value.optionIds);
		case 'numeric':
			return (
				typeof value.value === 'number' &&
				Number.isFinite(value.value) &&
				(value.unit === undefined || typeof value.unit === 'string')
			);
		case 'contact':
			return isRecord(value.fields) && Object.values(value.fields).every((field) => typeof field === 'string');
		default:
			return false;
	}
}

function isQuestionnaireAnswers(value: unknown): value is QuestionnaireAnswers {
	if (!isRecord(value)) return false;
	if (!Number.isInteger(value.firstUnansweredIndex)) return false;

	return isRecord(value.byQuestionId) && Object.values(value.byQuestionId).every(isAnswer);
}

function isPatientDetails(value: unknown): value is PatientDetails {
	if (!isRecord(value)) return false;

	return (
		typeof value.firstName === 'string' &&
		typeof value.lastName === 'string' &&
		typeof value.email === 'string' &&
		typeof value.dateOfBirth === 'string' &&
		(value.phone === undefined || typeof value.phone === 'string')
	);
}

function isShippingAddress(value: unknown): value is ShippingAddress {
	if (!isRecord(value)) return false;

	return (['street', 'postcode', 'city', 'country', 'deliveryEstimate'] as const).every(
		(field) => typeof value[field] === 'string'
	);
}

/**
 * Validates untrusted storage JSON. Returns `null` on any failure rather than throwing,
 * and rebuilds the session field by field so unknown keys never survive a read.
 */
export function parseSession(raw: string | null): JourneySession | null {
	if (!raw) return null;

	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return null;
	}

	if (!isRecord(value) || value.version !== SESSION_VERSION) return null;

	const questionnaire = value.questionnaire;
	if (!isRecord(questionnaire)) return null;
	if (typeof questionnaire.completed !== 'boolean') return null;
	if (!isQuestionnaireAnswers(questionnaire.answers)) return null;

	if (!isNullableString(value.selectedTreatmentId)) return null;
	if (!isStringArray(value.selectedAddOnIds)) return null;
	if (!isNullOr(value.patient, isPatientDetails)) return null;
	if (!isNullOr(value.shipping, isShippingAddress)) return null;
	if (!isNullableString(value.orderId)) return null;

	return {
		version: SESSION_VERSION,
		questionnaire: { answers: questionnaire.answers, completed: questionnaire.completed },
		selectedTreatmentId: value.selectedTreatmentId,
		selectedAddOnIds: value.selectedAddOnIds,
		patient: value.patient,
		shipping: value.shipping,
		orderId: value.orderId
	};
}

export function readSession(): JourneySession | null {
	if (!browser) return null;

	try {
		return parseSession(sessionStorage.getItem(STORAGE_KEY));
	} catch {
		return null;
	}
}

export function writeSession(session: JourneySession): void {
	if (!browser) return;

	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
	} catch {
		// Quota or a privacy mode that rejects writes: state stays in memory for this page.
	}
}

export function clearSession(): void {
	if (!browser) return;

	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		// Same rejection path as writeSession; a failed clear must not break the page.
	}
}
