import { env } from '$env/dynamic/public';
import { CHECKOUT_COUNTRY_CODE } from './checkout';
import {
	buildApiBaseUrl,
	buildQuestionnaireUrl,
	configured,
	DEFAULT_RECOMMENDATION_BASE_PATH
} from './rxscale-urls';

/**
 * Dynamic rather than static env: the build must not break when the uid is absent, and one
 * build has to be able to point at the fixture server or another questionnaire.
 */

function apiBaseUrl(): string {
	return buildApiBaseUrl(env.PUBLIC_RXSCALE_API_BASE_URL);
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
	return buildQuestionnaireUrl(
		uid,
		env.PUBLIC_RXSCALE_API_BASE_URL,
		env.PUBLIC_RXSCALE_ANAMNESIS_BASE_PATH
	);
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
