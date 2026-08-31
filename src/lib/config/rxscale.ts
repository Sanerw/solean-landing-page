import { env } from '$env/dynamic/public';
import { CHECKOUT_COUNTRY_CODE } from './checkout';

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

/**
 * The recommendation is on `/api/v2` and only there: `/api/v3-1` answers the same request
 * with an empty list, so the newer prefix would silently look like "nothing recommended".
 * That is why this is its own setting rather than the anamnesis path above.
 */
const DEFAULT_RECOMMENDATION_BASE_PATH = '/api/v2/anamnesis';

/** An env var set to an empty string is not configuration, so it reads as absent. */
function configured(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function apiBaseUrl(): string {
	return (configured(env.PUBLIC_RXSCALE_API_BASE_URL) ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

/**
 * The shop RxScale keys its catalogue by, which is the storefront hostname rather than the
 * myshopify domain: `mygina.myshopify.com` is refused where `solean.com` is answered. No
 * default exists, because it is per deployment, and an unset one means no recommendation.
 */
export function recommendationShop(): string | null {
	return configured(env.PUBLIC_RXSCALE_SHOP_IDENTIFIER);
}

export function questionnaireUid(): string | null {
	return configured(env.PUBLIC_RXSCALE_QUESTIONNAIRE_UID);
}

export function questionnaireUrl(uid: string): string {
	const basePath = configured(env.PUBLIC_RXSCALE_ANAMNESIS_BASE_PATH) ?? DEFAULT_ANAMNESIS_BASE_PATH;

	return `${apiBaseUrl()}${basePath}/questionnaires/${encodeURIComponent(uid)}`;
}

/**
 * Null when no shop is configured, because the call is meaningless without one. `limit` is
 * deliberately not sent: the parameter the newer snippet adds makes this route answer 400.
 */
export function recommendationUrl(anamnesisUid: string): string | null {
	const shop = recommendationShop();
	if (!shop) return null;

	const basePath =
		configured(env.PUBLIC_RXSCALE_RECOMMENDATION_BASE_PATH) ?? DEFAULT_RECOMMENDATION_BASE_PATH;
	const query = new URLSearchParams({
		shop_identifier: shop,
		locale: configured(env.PUBLIC_RXSCALE_LOCALE) ?? 'de',
		country_code: CHECKOUT_COUNTRY_CODE
	});

	return `${apiBaseUrl()}${basePath}/${encodeURIComponent(anamnesisUid)}/recommendation?${query}`;
}

/**
 * The same prefix the model came from, because that is where the route is. `/v4/anamnesis`
 * is documented but not routed on api.rxscale.com: a request to it falls through to object
 * storage, while `/api/v2` and `/api/v3-1` answer 405 to anything but a POST here.
 */
export function submissionsUrl(uid: string): string {
	return `${questionnaireUrl(uid)}/submissions`;
}
