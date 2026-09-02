import { env } from '$env/dynamic/public';

/**
 * Dynamic rather than static env, for the reason `config/rxscale.ts` gives: a build must not
 * break when the token is absent, and one build has to be able to run without analytics at
 * all. An unconfigured token is not an error; it is a deployment that does not measure.
 */

/**
 * EU residency. The project this token belongs to lives in Mixpanel's European region, and a
 * token from an EU project sent to the US ingestion host is simply rejected, so this default
 * is part of the token rather than a preference.
 */
const DEFAULT_API_HOST = 'https://api-eu.mixpanel.com';

function configured(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export function mixpanelToken(): string | null {
	return configured(env.PUBLIC_MIXPANEL_TOKEN);
}

/**
 * Whether this deployment measures at all. Read on the server as well as in the browser, so
 * the consent banner is server-rendered or absent rather than appearing after hydration.
 * A deployment with no token must not ask for consent it has no use for.
 */
export function analyticsConfigured(): boolean {
	return mixpanelToken() !== null;
}

export function mixpanelApiHost(): string {
	return configured(env.PUBLIC_MIXPANEL_API_HOST) ?? DEFAULT_API_HOST;
}
