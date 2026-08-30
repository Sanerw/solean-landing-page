import { questionnaireUrl, submissionsUrl } from '$lib/config/rxscale';

/** The RxScale anamnesis document. `theme` is SurveyJS theming we deliberately do not use. */
export interface QuestionnaireDocument {
	model: SurveyModelJson;
	theme: unknown;
	type: string;
	identifier: string;
	/** Documented as an integer for v4, returned as a string by the live API. Kept as text. */
	version: string;
}

export interface SurveyModelJson {
	pages: unknown[];
	[key: string]: unknown;
}

/**
 * `not-found` means the configured uid is wrong, which is worth telling a developer.
 * `unavailable` is every other failure, including a body that is not a usable
 * questionnaire. Both stop the flow: there is no local fallback questionnaire.
 */
export type QuestionnaireFetchResult =
	| { ok: true; document: QuestionnaireDocument }
	| { ok: false; reason: 'not-configured' | 'not-found' | 'unavailable' };

type Fetch = typeof globalThis.fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/**
 * A questionnaire with no pages is not answerable, so it fails here rather than rendering
 * as an empty flow.
 */
function toDocument(body: unknown): QuestionnaireDocument | null {
	if (!isRecord(body) || !isRecord(body.model)) return null;

	const { model, theme, type, identifier, version } = body;
	if (!Array.isArray(model.pages) || model.pages.length === 0) return null;
	if (typeof type !== 'string' || typeof identifier !== 'string') return null;
	if (typeof version !== 'string' && typeof version !== 'number') return null;

	return {
		model: { ...model, pages: model.pages },
		theme,
		type,
		identifier,
		version: String(version)
	};
}

/**
 * Fetched on every entry to the flow and never cached: the questionnaire is versioned and
 * can change between visits, and a stale model means a submission the validator rejects.
 * Takes the caller's `fetch` so a load function's request is reused across SSR and hydration.
 */
export async function fetchQuestionnaire(
	fetch: Fetch,
	uid: string | null
): Promise<QuestionnaireFetchResult> {
	if (uid === null) return { ok: false, reason: 'not-configured' };

	let response: Response;
	try {
		response = await fetch(questionnaireUrl(uid), {
			headers: { accept: 'application/json' },
			cache: 'no-store'
		});
	} catch {
		return { ok: false, reason: 'unavailable' };
	}

	// The docs promise 404 for an unknown questionnaire; the live API answers 400 with
	// "Error loading questionnaires". The uid is the only input this request carries, so
	// either status means the same thing to us: that uid is not a questionnaire.
	if (response.status === 404 || response.status === 400) {
		return { ok: false, reason: 'not-found' };
	}
	if (!response.ok) return { ok: false, reason: 'unavailable' };

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		return { ok: false, reason: 'unavailable' };
	}

	const document = toDocument(body);
	return document ? { ok: true, document } : { ok: false, reason: 'unavailable' };
}

/**
 * `rejected` is the model validator disagreeing with us, which should not happen: the same
 * model validated every page in the browser first. It carries the server's own messages,
 * never ours. `unavailable` covers the documented 502 and every transport failure, and both
 * mean the same thing to the person: nothing was saved, try again.
 */
export type AnamnesisSubmission =
	| { ok: true; uid: string }
	| { ok: false; reason: 'rejected'; messages: string[] }
	| { ok: false; reason: 'not-found' }
	| { ok: false; reason: 'unavailable' };

/**
 * Two documented shapes for a 400: a list of validation problems, or an object of field
 * names to problems when the request body itself is malformed. Anything else yields no
 * messages, and the screen says so in its own words rather than inventing one.
 */
function toMessages(body: unknown): string[] {
	if (!isRecord(body)) return [];
	const error = body.error;

	if (typeof error === 'string') return [error];
	if (Array.isArray(error)) return error.filter((entry): entry is string => typeof entry === 'string');

	if (isRecord(error)) {
		return Object.values(error)
			.flatMap((value) => (Array.isArray(value) ? value : [value]))
			.filter((entry): entry is string => typeof entry === 'string');
	}

	return [];
}

/**
 * Creates the anamnesis a doctor will read. Public, so it is called from the browser exactly
 * as RxScale's own storefront snippet does, and the answers are sent under one `data` key in
 * the shape the engine holds them.
 *
 * Nothing here is logged: the payload, the response and the uid are medical data.
 */
export async function submitAnamnesis(
	fetch: Fetch,
	uid: string | null,
	data: Record<string, unknown>
): Promise<AnamnesisSubmission> {
	if (uid === null) return { ok: false, reason: 'not-found' };

	let response: Response;
	try {
		response = await fetch(submissionsUrl(uid), {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json' },
			body: JSON.stringify({ data })
		});
	} catch {
		return { ok: false, reason: 'unavailable' };
	}

	if (response.status === 404) return { ok: false, reason: 'not-found' };

	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (response.status === 400) {
		return { ok: false, reason: 'rejected', messages: toMessages(body) };
	}

	if (!response.ok) return { ok: false, reason: 'unavailable' };

	// A 2xx without a uid is not a success we can use: feature 13 cannot order without it.
	const created = isRecord(body) && typeof body.uid === 'string' ? body.uid : null;

	return created ? { ok: true, uid: created } : { ok: false, reason: 'unavailable' };
}
