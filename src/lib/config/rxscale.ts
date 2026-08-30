import { env } from '$env/dynamic/public';

/**
 * Dynamic rather than static env: the build must not break when the uid is absent, and one
 * build has to be able to point at the fixture server or another questionnaire.
 */

const DEFAULT_API_BASE_URL = 'https://api.rxscale.com';

/**
 * The documented `/v4/anamnesis` prefix is not routed on api.rxscale.com; requests to it
 * fall through to object storage. Of the prefixes that do answer, `/api/v3-1/anamnesis` is
 * the one RxScale's current snippet (v2.7) calls, while solean.com still runs the older
 * v1.0 snippet against `/api/v2/anamnesis`. All three return the identical document, so the
 * default follows their newest shipping client and moving to v4 is an env change.
 */
const DEFAULT_ANAMNESIS_BASE_PATH = '/api/v3-1/anamnesis';

/** An env var set to an empty string is not configuration, so it reads as absent. */
function configured(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export function questionnaireUid(): string | null {
	return configured(env.PUBLIC_RXSCALE_QUESTIONNAIRE_UID);
}

export function questionnaireUrl(uid: string): string {
	const baseUrl = configured(env.PUBLIC_RXSCALE_API_BASE_URL) ?? DEFAULT_API_BASE_URL;
	const basePath = configured(env.PUBLIC_RXSCALE_ANAMNESIS_BASE_PATH) ?? DEFAULT_ANAMNESIS_BASE_PATH;

	return `${baseUrl.replace(/\/+$/, '')}${basePath}/questionnaires/${encodeURIComponent(uid)}`;
}
