import { submissionsUrl } from '$lib/config/rxscale';

/**
 * The RxScale anamnesis document, as the snapshot and the contract test read it. Nothing on
 * a visitor's path fetches it any more: from feature 24 the questionnaire is defined in this
 * repository, and `pnpm check:model` is what compares the two.
 */
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

type Fetch = typeof globalThis.fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
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
 * the shape their model expects. From feature 24 that shape comes from `toAnamnesisData`
 * rather than from a survey engine holding their document.
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
