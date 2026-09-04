/**
 * How an RxScale URL is built, with no environment access of its own.
 *
 * Split from `rxscale.ts` so a plain Node script can import it. That module imports
 * `$env/dynamic/public`, a virtual module only SvelteKit's build provides, so anything
 * importing it is unusable outside the app. `scripts/check-model-contract.ts` needs the same
 * URL the app calls, and duplicating these constants there is exactly the silent divergence
 * this feature exists to catch.
 */

export const DEFAULT_API_BASE_URL = 'https://api.rxscale.com';

/**
 * The documented `/v4/anamnesis` prefix is not routed on api.rxscale.com; requests to it fall
 * through to object storage. Of the prefixes that do answer, `/api/v3-1/anamnesis` is the one
 * RxScale's current snippet calls.
 */
export const DEFAULT_ANAMNESIS_BASE_PATH = '/api/v3-1/anamnesis';

/**
 * The recommendation is on `/api/v2` and only there: `/api/v3-1` answers the same request
 * with an empty list, so the newer prefix would silently look like "nothing recommended".
 */
export const DEFAULT_RECOMMENDATION_BASE_PATH = '/api/v2/anamnesis';

/** An env var set to an empty string is not configuration, so it reads as absent. */
export function configured(value: string | undefined): string | null {
	const trimmed = value?.trim();

	return trimmed ? trimmed : null;
}

export function buildApiBaseUrl(configuredBaseUrl: string | undefined): string {
	return (configured(configuredBaseUrl) ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export function buildQuestionnaireUrl(
	uid: string,
	configuredBaseUrl: string | undefined,
	configuredBasePath: string | undefined
): string {
	const basePath = configured(configuredBasePath) ?? DEFAULT_ANAMNESIS_BASE_PATH;

	return `${buildApiBaseUrl(configuredBaseUrl)}${basePath}/questionnaires/${encodeURIComponent(uid)}`;
}
